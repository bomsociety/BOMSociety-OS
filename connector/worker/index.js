const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxcEvPgSv9gDWey7A9SFMA-OqMjpMZWHm8zUpofjofPmqPMnyzRWg_qhrzj-K6sWNCT/exec";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return jsonResponse({ success: false, error: "POST requests only." }, 405);
    }

    try {
      const requestBody = await request.text();
      if (!requestBody) {
        return jsonResponse({ success: false, error: "Missing JSON request body." }, 400);
      }

      let parsedBody;
      try {
        parsedBody = JSON.parse(requestBody);
      } catch {
        return jsonResponse({ success: false, error: "Request body must be valid JSON." }, 400);
      }

      const upstreamResponse = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedBody),
        redirect: "follow"
      });

      const upstreamText = await upstreamResponse.text();
      let upstreamData;
      try {
        upstreamData = JSON.parse(upstreamText);
      } catch {
        return jsonResponse({
          success: false,
          error: "Apps Script returned a non-JSON response.",
          upstream_status: upstreamResponse.status,
          upstream_response: upstreamText.slice(0, 1000)
        }, 502);
      }

      return jsonResponse(upstreamData, upstreamResponse.ok ? 200 : 502);
    } catch (error) {
      return jsonResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
