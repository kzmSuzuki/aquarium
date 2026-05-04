"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";

// ==========================================
// Boid（群れ）アルゴリズム クラス
// ==========================================
class Boid {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  maxForce: number;
  maxSpeed: number;

  constructor(mesh: THREE.Mesh) {
    this.mesh = mesh;
    this.position = new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    this.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.maxSpeed = 0.03 + Math.random() * 0.02;
    this.maxForce = 0.001;
    this.mesh.position.copy(this.position);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    this.position.add(this.velocity);
    this.mesh.position.copy(this.position);
    this.acceleration.set(0, 0, 0);

    const target = this.position.clone().add(this.velocity);
    this.mesh.lookAt(target);
    this.mesh.rotateY(-Math.PI / 2);
  }

  applyForce(force: THREE.Vector3) {
    this.acceleration.add(force);
  }

  flock(boids: Boid[]) {
    const sep = this.separate(boids).multiplyScalar(1.5);
    const ali = this.align(boids).multiplyScalar(1.0);
    const coh = this.cohere(boids).multiplyScalar(1.0);
    const bound = this.boundaries().multiplyScalar(2.0);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
    this.applyForce(bound);
  }

  boundaries() {
    const radius = 6.0;
    const d = this.position.length();
    let steer = new THREE.Vector3(0,0,0);
    if (d > radius) {
      steer = this.position.clone().normalize().multiplyScalar(-this.maxSpeed).sub(this.velocity);
      steer.clampLength(0, this.maxForce * 2);
    }
    return steer;
  }

  separate(boids: Boid[]) {
    const desiredSeparation = 1.0;
    const steer = new THREE.Vector3();
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        const other = boids[i];
        const d = this.position.distanceTo(other.position);
        if ((d > 0) && (d < desiredSeparation)) {
            const diff = this.position.clone().sub(other.position).normalize().divideScalar(d);
            steer.add(diff);
            count++;
        }
    }
    if (count > 0) steer.divideScalar(count);
    if (steer.length() > 0) steer.normalize().multiplyScalar(this.maxSpeed).sub(this.velocity).clampLength(0, this.maxForce);
    return steer;
  }

  align(boids: Boid[]) {
    const neighborDist = 2.0;
    const sum = new THREE.Vector3();
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        const other = boids[i];
        const d = this.position.distanceTo(other.position);
        if ((d > 0) && (d < neighborDist)) {
            sum.add(other.velocity);
            count++;
        }
    }
    if (count > 0) {
        sum.divideScalar(count).normalize().multiplyScalar(this.maxSpeed);
        return sum.sub(this.velocity).clampLength(0, this.maxForce);
    }
    return new THREE.Vector3();
  }

  cohere(boids: Boid[]) {
    const neighborDist = 2.0;
    const sum = new THREE.Vector3();
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        const other = boids[i];
        const d = this.position.distanceTo(other.position);
        if ((d > 0) && (d < neighborDist)) {
            sum.add(other.position);
            count++;
        }
    }
    if (count > 0) {
        sum.divideScalar(count);
        const desired = sum.sub(this.position).normalize().multiplyScalar(this.maxSpeed);
        return desired.sub(this.velocity).clampLength(0, this.maxForce);
    }
    return new THREE.Vector3();
  }
}

const computeDeviceOrientationQuaternion = (() => {
  const zee = new THREE.Vector3(0, 0, 1);
  const euler = new THREE.Euler();
  const q0 = new THREE.Quaternion();
  const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); 
  
  return (quaternion: THREE.Quaternion, alpha: number, beta: number, gamma: number, orient: number) => {
    const degToRad = Math.PI / 180;
    euler.set(beta * degToRad, alpha * degToRad, -gamma * degToRad, 'YXZ');
    quaternion.setFromEuler(euler);
    quaternion.multiply(q1);
    quaternion.multiply(q0.setFromAxisAngle(zee, -orient * degToRad));
  };
})();

export default function ViewerPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const boidsRef = useRef<Boid[]>([]);
  const requestRef = useRef<number>(0);
  const deviceOrientationRef = useRef<{ alpha: number, beta: number, gamma: number } | null>(null);
  
  // カメラの親グループ（リセット用）をRefで保持
  const cameraGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  const startAR = async () => {
    setIsLoading(true);
    try {
      if (typeof (window as any).DeviceOrientationEvent !== 'undefined' && 
          typeof (window as any).DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await (window as any).DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') throw new Error("ジャイロセンサーの利用が許可されませんでした。");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;

      const res = await fetch("/api/fish/random?eventId=event_spring2026&count=15");
      if(!res.ok) throw new Error("データの取得に失敗しました");
      const fishData = await res.json();

      window.addEventListener("deviceorientation", (e) => {
        if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
          deviceOrientationRef.current = { alpha: e.alpha, beta: e.beta, gamma: e.gamma };
        }
      });

      initThreeJS(fishData);
      setIsStarted(true);
    } catch(err: any) {
      console.error(err);
      setErrorMsg(err.message || "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const initThreeJS = (fishList: any[]) => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    
    // カメラとそれを包むグループの作成（リセット機能のため）
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const cameraGroup = new THREE.Group();
    cameraGroup.add(camera);
    scene.add(cameraGroup);
    
    cameraRef.current = camera;
    cameraGroupRef.current = cameraGroup;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    const boids: Boid[] = [];
    const fishItems = fishList.length > 0 ? fishList : Array(20).fill({ imageUrl: "https://www.transparenttextures.com/patterns/cubes.png" });

    fishItems.forEach((fish: any) => {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({ 
        map: textureLoader.load(fish.imageUrl),
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      boids.push(new Boid(mesh));
    });
    boidsRef.current = boids;

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      boidsRef.current.forEach(b => {
        b.flock(boidsRef.current);
        b.update();
      });

      if (deviceOrientationRef.current) {
        const { alpha, beta, gamma } = deviceOrientationRef.current;
        const orient = window.orientation ? Number(window.orientation) : 0;
        computeDeviceOrientationQuaternion(camera.quaternion, alpha, beta, gamma, orient);
      }

      renderer.render(scene, camera);
    };
    animate();
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // 視点の正面をリセットする処理
  const handleRecenter = () => {
    if (cameraRef.current && cameraGroupRef.current) {
      // 現在のカメラのY軸回転（ヨー）を取得し、親グループを逆回転させて正面を補正する
      const currentEuler = new THREE.Euler().setFromQuaternion(cameraRef.current.quaternion, 'YXZ');
      cameraGroupRef.current.rotation.y = -currentEuler.y;
    }
  };

  return (
    <main className="relative min-h-screen bg-black overflow-hidden font-sans">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-0" />
      <div ref={mountRef} className={`absolute inset-0 z-10 transition-opacity duration-1000 ${isStarted ? 'opacity-100' : 'opacity-0'}`} />

      {/* トップUI */}
      <Link href="/" className="absolute top-6 left-6 z-30 px-6 py-3 bg-black/50 text-white font-bold rounded-full backdrop-blur-md border border-white/20">
        ← ホームにもどる
      </Link>

      {/* 視点リセットボタン */}
      {isStarted && (
        <button 
          onClick={handleRecenter}
          className="absolute top-6 right-6 z-30 px-6 py-3 bg-blue-600/80 text-white font-bold rounded-full backdrop-blur-md border border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.5)] active:scale-95"
        >
          正面をリセット 🎯
        </button>
      )}

      {/* 開始前のアナウンス・ボタン画面 */}
      {!isStarted && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-cyan-900/80 p-8 md:p-12 border-4 border-cyan-400 rounded-3xl text-center max-w-lg shadow-[0_0_50px_rgba(0,180,255,0.4)]">
            <h2 className="text-4xl text-white font-extrabold mb-6">AR水族館のじゅんび</h2>
            <p className="text-cyan-100 text-lg font-bold mb-8 leading-relaxed">
              まわりをみわたして、<br/>みんなの魚をさがそう！<br/>
              <span className="text-sm mt-2 block opacity-80">（※カメラとセンサーの許可が必要です）</span>
            </p>
            {errorMsg && <p className="text-red-400 font-bold mb-4">{errorMsg}</p>}
            <button onClick={startAR} disabled={isLoading} className="px-10 py-5 bg-teal-500 text-white font-extrabold text-2xl rounded-full shadow-[0_5px_20px_rgba(0,255,128,0.5)] hover:bg-teal-400 disabled:opacity-50">
              {isLoading ? "じゅんび中..." : "すいぞくかんへ Go!"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
