const dotPNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
async function test() {
  try {
    console.log("Creating test request...");
    const res = await fetch("http://localhost:3000/api/fish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64Image: dotPNG,
        templateId: "template_test",
        eventId: "test_event_999"
      })
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);
    process.exit(res.ok ? 0 : 1);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
test();
