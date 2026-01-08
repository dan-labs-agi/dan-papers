import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      profile(githubProfile) {
        return {
          id: githubProfile.id.toString(),
          name: githubProfile.name ?? "Anonymous",
          email: githubProfile.email ?? undefined,
          image: githubProfile.picture as string,
          userId: githubProfile.id.toString(),
        };
      },
    }),
  ],
});
