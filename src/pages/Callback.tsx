import { useEffect, useState } from "react";
import {
  compareArtists,
  saveProfileData,
  saveTopArtists,
} from "../lib/backendHelpers";
import {
  fetchProfile,
  fetchTopArtists,
  getAccessToken,
} from "../lib/spotifyHelpers";
import { frontendBaseUrl } from "../const";

function Callback() {
  const code = new URLSearchParams(window.location.search).get("code");
  const compareWithUserName = new URLSearchParams(window.location.search).get(
    "state"
  );

  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    id: string;
    display_name: string;
    email: string;
  } | null>(null);

  const [artistsInCommon, setArtistsInCommon] = useState<any>(null);

  useEffect(() => {
    handleGetSpotifyInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetSpotifyInfo = async () => {
    if (code) {
      const accessToken = await getAccessToken(code);
      const profile = await fetchProfile(accessToken);
      const topArtists = await fetchTopArtists(accessToken);

      if (profile && topArtists) {
        setProfile(profile);
        // Save data to backend
        try {
          const { id, display_name, email } = profile;
          await saveProfileData({
            spotifyUserId: id,
            name: display_name,
            email: email,
            accessToken: accessToken,
          });

          const mappedArtists = topArtists.items.map((artist) => ({
            artistId: artist.id,
            artistName: artist.name,
            ...artist,
          }));

          await saveTopArtists(id, mappedArtists);
          console.log({ id, compareWithUserName });
          if (compareWithUserName) {
            const res = await compareArtists(id, compareWithUserName);
            const data = await res.json();

            setArtistsInCommon(data);
          }
        } catch (error) {
          console.log(error);
          setError("Kunne ikke lagre data til backend");
        }
      }
    } else {
      setError("Fikk ingen kode fra Spotify");
    }
  };

  const shareUrl = frontendBaseUrl + "?compareWithUserName=" + profile?.id;

  return (
    <>
      <a href="/">← Tilbake</a>
      {code && (
        <div>
          Du er logget inn {profile?.display_name}!
          <p>
            Del din profil med andre ved å sende dem denne linken:{" "}
            <a href={shareUrl}>{shareUrl}</a>
          </p>
        </div>
      )}
      {error && (
        <p
          style={{
            background: "lightcoral",
            color: "darkred",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid darkred",
          }}
        >
          {error}
        </p>
      )}
      {!code && (
        <>
          <p>Ingen kode</p>
          <a
            style={{
              background: "lightgreen",
              color: "darkgreen",
            }}
            href="/"
          >
            ← Tilbake til forsiden
          </a>
        </>
      )}
      {artistsInCommon && (
        <>
          <h2>Artister du har til felles med {compareWithUserName}</h2>
          <ul>
            {artistsInCommon.map((artist: any) => (
              <li key={artist.artistId}>
                <p>{artist.artistName}</p>
                <span>{compareWithUserName} sin plassering: {artist.userBRank}</span>
                <span>{profile?.display_name} sin plassering: {artist.userARank}</span>

              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default Callback;
