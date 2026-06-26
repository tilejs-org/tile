import axios from "axios";
import settings from "../../settings.json" with { type: "json" };

const github = settings.services.github;

export async function getRepository(path: String) {
  const url = `https://raw.githubusercontent.com/${github.owner}/${github.repository}/${github.brench}/${path}`;
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "tilejs-api" },
  });
  return data;
}