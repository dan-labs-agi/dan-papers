
import { httpRouter } from "convex/server";
import { auth } from "./auth";

import { httpAction } from "./_generated/server";

const http = httpRouter();

auth.addHttpRoutes(http);



http.route({
    pathPrefix: "/",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        if (url.pathname === "/") {
            return new Response("Convex HTTP Server Running", { status: 200 });
        }
        console.log(`[HTTP 404] No route found for: ${request.method} ${url.pathname}`);
        return new Response("No matching routes found", { status: 404 });
    }),
});

export default http;
