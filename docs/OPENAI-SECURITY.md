# Securing OpenAI pitch creation

All pitch generation that uses OpenAI is done **server-side only**. The client never sees or sends an API key.

## How it’s secured

1. **API key only on the server**  
   `OPENAI_API_KEY` is set in `.env.local` (or your host’s env). It’s only read in the API route `app/api/pitches/generate/route.ts`. It is never sent to the browser or included in client bundles.

2. **Auth required**  
   The generate route calls `supabase.auth.getUser()`. If there’s no session, it returns 401. Only logged-in users can hit the endpoint.

3. **Scoped to target list**  
   The request body can only contain `podcast_ids`. The server checks that every ID is in that user’s **target_list**. Requests for other podcasts are ignored and return 400. This prevents abuse and limits OpenAI usage to intended podcasts.

4. **Rate limit**  
   A daily cap (e.g. 10 pitches per user per day) is enforced in the same route. After that, the route returns 429. You can change `DAILY_CAP` in the route.

5. **No key or backend errors to the client**  
   If the OpenAI call fails, the route catches the error and returns a template-generated pitch instead. The client never receives raw OpenAI errors or any hint of the API key.

## What you need to do

- **Keep the key out of the repo**  
  Use `.env.local` (and ensure it’s in `.gitignore`). In production, set `OPENAI_API_KEY` in your host’s environment (e.g. Vercel).

- **Optional: tighten usage**  
  In the [OpenAI dashboard](https://platform.openai.com/usage) you can set usage or budget limits for the key.

- **Optional: separate key for production**  
  Use one key for development and another for production so you can rotate or revoke them independently.
