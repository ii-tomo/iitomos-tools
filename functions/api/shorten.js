export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    try {
        const { long_url } = await request.json();
        const bitlyToken = env.BITLY_API_TOKEN;

        if (!bitlyToken) {
            return new Response(JSON.stringify({ error: "BITLY_API_TOKEN not configured on server" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const response = await fetch("https://api-ssl.bitly.com/v4/shorten", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${bitlyToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ long_url })
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
