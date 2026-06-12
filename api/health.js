export default function handler(_request, response) {
  response.status(200).json({
    ok: true,
    name: "vorexis-claw",
    runtime: "vercel",
  });
}
