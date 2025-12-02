const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '4cdee2db405f4e978c9c8f05055a7cb8';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '6547787c63734cd8bcd61943885b122e';

app.use(cors());
app.use(express.json());

let accessToken = null;
let tokenExpiry = null;

const getSpotifyToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
    
    return accessToken;
  } catch (error) {
    console.error('Token error:', error);
    throw error;
  }
};

app.get('/api/search-artist', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const token = await getSpotifyToken();
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/artist-releases/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;
    const token = await getSpotifyToken();
    
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=50`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Releases error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/album-tracks/:albumId', async (req, res) => {
  try {
    const { albumId } = req.params;
    const token = await getSpotifyToken();
    
    const response = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}/tracks`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Album tracks error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search-playlists', async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;
    const token = await getSpotifyToken();
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&market=US&limit=${limit}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Playlist search error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/playlist-tracks/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { limit = 100 } = req.query;
    const token = await getSpotifyToken();
    
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Playlist tracks error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
