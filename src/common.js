export const ACCESS_TOKEN = 'ACCESS_TOKEN';
export const TOKEN_TYPE = 'TOKEN_TYPE';
export const EXPIRES_IN = 'EXPIRES_IN';
export const LOADED_TRACKS = 'LOADED_TRACKS';

const APP_URL = import.meta.env.VITE_APP_URL

export const ENDPOINT = {
    userInfo: "me",
    featuredPlaylist: 'browse/featured-playlists?limit=5',
    toplists: 'browse/categories/toplists/playlists?limit=10',
    playlist: 'playlists',
    userPlaylist: 'me/playlists'
}

export const logout = () =>
{
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_TYPE);
    localStorage.removeItem(EXPIRES_IN);
    window.location.href = APP_URL;
}

export const SECTION_TYPE = {
    DASHBOARD: "DASHBOARD",
    PLAYLIST: "PLAYLIST"
}

export const setItemInLocalStorage = (key, val) => localStorage.setItem(key, JSON.stringify(val));
export const getItemFromLocalStorage = key => JSON.parse(localStorage.getItem(key));