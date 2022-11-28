import { fetchRequest } from '../api';
import { ENDPOINT, getItemFromLocalStorage, LOADED_TRACKS, logout, SECTION_TYPE, setItemInLocalStorage } from '../common';

let progressInterval;

const onProfileClick = event =>
{
    event.stopPropagation();
    const profileMenu = document.querySelector('#profile-menu');
    profileMenu.classList.toggle('hidden');
    if (!profileMenu.classList.contains('hidden'))
    {
        profileMenu.querySelector('#logout').addEventListener('click', logout);
    }
}

const loadUserProfile = () =>
{
    return new Promise(async (resolve, reject) => {
        const defaultImage = document.querySelector('#default-image');
        const profileButton = document.querySelector("#user-profile-btn");
        const displayNameElement = document.querySelector('#display-name');

        const {display_name: displayName, images} = await fetchRequest(ENDPOINT.userInfo);
        
        displayNameElement.textContent = displayName;
        if (images?.length)
        {
            defaultImage.classList.add('hidden');
        } else
        {
            defaultImage.classList.remove('hidden');
        }
        profileButton.addEventListener('click', onProfileClick);
        resolve({displayName});
    })
}

const onPlaylistItemClicked = (event, id) =>
{
    const section = { type: SECTION_TYPE.PLAYLIST, playlist: id };
    history.pushState(section, "", `playlist/${id}`);
    loadSection(section);
}

const loadPlaylist = async (endpoint, elementId) =>
{
    const { playlists: { items } } = await fetchRequest(endpoint);
    const featuredPlaylist = document.querySelector(`#${elementId}`);
    items.forEach(({name, description, images, id}) =>
    {
        const playlistItem = document.createElement('section');
        playlistItem.className = 'bg-black-secondary rounded p-4 hover:cursor-pointer hover:bg-light-black';
        playlistItem.id = id;
        playlistItem.setAttribute('data-type', 'playlist');
        const [image] = images;
        playlistItem.innerHTML = `<img src="${image.url}" alt="${name}" class="rounded mb-2 object-contain shadow">
                        <h2 class="text-base font-semibold mb-4 truncate">${name}</h2>
                        <h3 class="text-sm text-secondary line-clamp-2">${description}</h3>`;
        playlistItem.addEventListener('click',event => onPlaylistItemClicked(event, id));
        featuredPlaylist.appendChild(playlistItem);
    });
    
}

const loadPlaylists = () =>
{
    loadPlaylist(ENDPOINT.featuredPlaylist, 'featured-playlist-items');
    loadPlaylist(ENDPOINT.toplists, 'top-playlist-items');
}

let displayName;
const fillContentForDashboard = () =>
{
    const coverContent = document.querySelector('#cover-content');
    coverContent.innerHTML = `<h1 class="text-6xl">Hello, ${displayName}</h1>`;
    const playlistMap = new Map([["featured", "featured-playlist-items"], ["top playlists", "top-playlist-items"]]);
    let innerHTML = '';
    for (let [type, id] of playlistMap)
    {
        innerHTML += `
        <article class="p-4">
                <h1 class="text-2xl mb-4 font-bold capitalize">${type}</h1>
                <section id="${id}" class="grid grid-cols-auto-fill-cards gap-4"></section>
            </article>
        `;
    }
    document.querySelector('#page-content').innerHTML = innerHTML;
}

const formatTime = duration =>
{
    const min = Math.floor(duration / 60_000);
    const sec = ((duration % 6_000) / 1000).toFixed(0);
    const formattedTime = sec == 60 ? min + 1 + ":00" : min + ":" + (sec < 10 ? "0" : "") + sec;
    return formattedTime;
}

const onTrackSelection = (id, event) =>
{
    document.querySelectorAll('#tracks .track').forEach(trackItem =>
    {
        if (trackItem.id === id)
        {
            trackItem.classList.add("bg-gray", "selected");
        } else
        {
            trackItem.classList.remove("bg-gray", "selected");
        }
    });
}

const updateIconsForPlayMode = id =>
{
    const playButton = document.querySelector("#play");
    playButton.querySelector('span').textContent = 'pause_circle';
    document.querySelector(`#play-track-${id} span`).textContent = 'pause';
}

const updateIconsForPauseMode = id =>
{
    const playButton = document.querySelector("#play");
    playButton.querySelector('span').textContent = 'play_circle';
    document.querySelector(`#play-track-${id} span`).textContent = 'play_arrow';
}

const onAudioMetaDataLoaded = (id) =>
{
    const totalSongDuration = document.querySelector("#total-song-duration");
    totalSongDuration.textContent = `0:${audio.duration.toFixed(0)}`;
}

const togglePlay = () => {
    if(audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}

const findCurrentTrack = () => {
    const audioControl = document.querySelector("#audio-control");
    const trackId = audioControl.getAttribute('data-track-id');
    if(trackId){
        const loadedTracks = getItemFromLocalStorage(LOADED_TRACKS);
        const currentTrackIndex = loadedTracks.findIndex(trk => trk.id === trackId);
        return {currentTrackIndex, tracks: loadedTracks};
    }
    null;
}

const playNextTrack = () => {
    const {currentTrackIndex = -1, tracks = null} = findCurrentTrack() ?? {};
    if(currentTrackIndex > -1 && currentTrackIndex < tracks.length-1) {
        playTrack(null, tracks[currentTrackIndex + 1]);
    } 
}

const playPrevTrack = () => {
    const {currentTrackIndex = -1, tracks = null} = findCurrentTrack() ?? {};
    if(currentTrackIndex > 0) {
        playTrack(null, tracks[currentTrackIndex - 1]);
    }
}

const playTrack = (event, { image, artistsName, name, duration, previewUrl, id }) =>
{
    if(event?.stopPropagation){
        event.stopPropagation();
    }
    if (audio.src === previewUrl)
    {
        togglePlay();
    } else
    {
        document.querySelector('#now-playing-image').src = image.url;
        document.querySelector('#now-playing-song').textContent = name;
        document.querySelector('#now-playing-artists').textContent = artistsName;
        document.querySelector('#audio-control').setAttribute('data-track-id', id);
        audio.src = previewUrl;
        audio.play();
        document.querySelector('#song-info').classList.remove('invisible');
    }
}

const loadPlaylistTracks = ({ tracks }) =>
{
    const trackSections = document.querySelector('#tracks');
    let trackNo = 1;
    const loadedTracks = [];
    for (let {track:trackItem} of tracks.items.filter(item => item.track.preview_url))
    {
        let { id, artists, name, album, duration_ms:duration, preview_url: previewUrl } = trackItem;
        const track = document.createElement('section');
        track.className = "track grid grid-cols-[50px_1fr_1fr_50px] items-center justify-items-start rounded-md hover:bg-light-black gap-4";
        track.id = id;
        let image = album.images.find(img => img.height === 64);
        let artistsName = Array.from(artists, artist => artist.name).join(", ");
        track.innerHTML = `
                        <p class="justify-self-center relative w-full flex items-center justify-center">
                            <span class="track-no">${trackNo++}</span>
                        </p>
                        <section class="grid grid-cols-[auto_1fr] place-items-center gap-1">
                            <img class="h-10 w-10" src="${image.url}" alt="${name}">
                            <article class="flex flex-col gap-2 justify-center">
                                <h2 class="text-primary text-base line-clamp-1 song-title">${name}</h2>
                                <p class="text-xs  line-clamp-1">${artistsName}</p>
                            </article>
                        </section>
                        <p class="text-sm">${album.name}</p>
                        <p class="text-sm">${formatTime(duration)}</p>`;
        track.addEventListener('click', event => onTrackSelection(id, event));
        const playButtonItem = document.createElement('button');
        playButtonItem.id = `play-track-${id}`;
        playButtonItem.className = `play w-full absolute flex justify-center invisible`;
        playButtonItem.innerHTML = `<span class="material-symbols-outlined">play_arrow</span>`;
        playButtonItem.addEventListener('click', event => playTrack(event, { image, artistsName, name, duration, previewUrl, id }));
        track.querySelector('p').appendChild(playButtonItem);
        trackSections.appendChild(track);
        loadedTracks.push({id, artistsName, name, album, duration, previewUrl, image});   
    }
    setItemInLocalStorage(LOADED_TRACKS, loadedTracks);
}

const fillContentForPlaylist = async playlistId =>
{
    const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`);
    const {name, description, images} = playlist;
    const coverElement = document.querySelector('#cover-content');
    coverElement.innerHTML = `
        <section class="grid grid-cols-[250px_1fr] auto-rows-[250px]">
            <img src="${images[0].url}" alt="${name}" class="object-contain h-48 w-48">
            <section class="flex flex-col justify-center">
                <h2 id="playlist-name" class="text-4xl">${name}</h2>
                <p id="playlist-artist"></p>
                <p id="playlist-details">${description}</p>
            </section>
        </section>`;
    const pageContent = document.querySelector('#page-content');
    pageContent.innerHTML = `<header id="playlist-header" class="mx-8 border-secondary border-b-[0.5px] z-10">
                    <nav class="py-2">
                        <ul class="grid grid-cols-[50px_2fr_1fr_50px] gap-4  text-secondary">
                            <li class="justify-self-center">#</li>
                            <li>Title</li>
                            <li>Album</li>
                            <li><span class="material-symbols-outlined">timer</span></li>
                        </ul>
                    </nav>
                </header>
                <section id="tracks" class="px-8 text-secondary mt-4"></section>`;
    loadPlaylistTracks(playlist);
}

const onContentScroll = event =>
{
    const { scrollTop } = event.target;
    const header = document.querySelector('#header');
    const coverElement = document.querySelector('#cover-content');
    const totalHeight = coverElement.offsetHeight;
    const coverOpacity = 100 - (scrollTop >= totalHeight ? 100 : (scrollTop/totalHeight)*100);
    const headerOpacity = scrollTop >= header.offsetHeight ? 100 : (scrollTop/header.offsetHeight)*100
    
    coverElement.style.opacity = `${coverOpacity}%`;
    header.style.background = `rgba(0 0 0 /${headerOpacity}%)`;
    if (history.state.type === SECTION_TYPE.PLAYLIST)
    {
        const playlistHeader = document.querySelector('#playlist-header');
        if (coverOpacity <= 30)
        {
            playlistHeader.classList.add('sticky', 'bg-black-secondary', 'px-8');
            playlistHeader.classList.remove('mx-8');
            playlistHeader.style.top = `${header.offsetHeight}px`;           
        } else
        {
            playlistHeader.classList.add('mx-8');
            playlistHeader.classList.remove('sticky', 'bg-black-secondary', 'px-8');
            playlistHeader.style.top = 'revert';           
        }
    }
}

const loadSection = ({type, playlist}) =>
{
    // type = SECTION_TYPE.PLAYLIST
    // playlist = '37i9dQZF1DWZMWLrh2UzwC';
    // history.pushState({type, playlist}, "", `playlist/${playlist}`)
    if (type == SECTION_TYPE.DASHBOARD)
    {
        fillContentForDashboard();
        loadPlaylists();
    } else if (type == SECTION_TYPE.PLAYLIST)
    {
        fillContentForPlaylist(playlist);
    }
    document.querySelector('.content').removeEventListener('scroll', onContentScroll);
    document.querySelector('.content').addEventListener('scroll', onContentScroll);
}

const onUserPlaylistClick = id => {
    const section = {type: SECTION_TYPE.PLAYLIST, playlist: id};
    history.pushState(section, "", `/dashboard/playlist/${id}`);
    loadSection(section);
}

const loadUserPlaylists = async () => {
    const playlists = await fetchRequest(ENDPOINT.userPlaylist);
    const userPlaylistSection = document.querySelector('#user-playlists > ul');
    userPlaylistSection.innerHTML = '';
    for(let {name, id} of playlists.items) {
        const li = document.createElement('li');
        li.textContent = name;
        li.className = 'hover:text-primary cursor-pointer';
        li.addEventListener('click', () => onUserPlaylistClick(id));
        userPlaylistSection.appendChild(li);
    }
}

const audio = new Audio();
document.addEventListener('DOMContentLoaded', async () =>
{
    const volume = document.querySelector('#volume');
    const playButton = document.querySelector("#play");
    const songDurationCompleted = document.querySelector("#song-duration-completed");
    const songProgress = document.querySelector("#progress");
    const timeline = document.querySelector("#timeline");
    const audioControl = document.querySelector('#audio-control');
    const next = document.querySelector('#next');
    const prev = document.querySelector('#prev');

    ({displayName} = await loadUserProfile());
    const section = { type: SECTION_TYPE.DASHBOARD };
    history.pushState(section, "", "");
    loadSection(section);
    loadUserPlaylists();
    document.addEventListener('click', () =>
    {
        const profileMenu = document.querySelector('#profile-menu');
        if (!profileMenu.classList.contains('hidden'))
        {
            profileMenu.classList.add('hidden');
        }
    });
    
    audio.addEventListener('loadedmetadata', () => onAudioMetaDataLoaded);
    audio.addEventListener('play', ()=> {
        const selectedTrackId = audioControl.getAttribute('data-track-id');
        const tracks = document.querySelector('#tracks');
        const playingTrack = tracks.querySelector('section.playing');
        const selectedTrack = tracks.querySelector(`[id="${selectedTrackId}"]`);
        if(playingTrack?.id !== selectedTrack?.id) {
            playingTrack?.classList.remove('playing');
        }
        selectedTrack.classList.add('playing');
        progressInterval = setInterval(() =>
        {
            if (audio.paused)
            {
                return;
            } 
            const currentTime = audio.currentTime.toFixed(0);
            songDurationCompleted.textContent = `0:${(currentTime<10?'0':'') + currentTime}`;
            songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
        }, 100);
        updateIconsForPlayMode(selectedTrackId);
    });
    audio.addEventListener('pause', () => {
        if(progressInterval) {
            clearInterval(progressInterval);
        }
        const selectedTrackId = audioControl.getAttribute('data-track-id');
        updateIconsForPauseMode(selectedTrackId);
    })
    playButton.addEventListener('click', togglePlay);
        
    volume.addEventListener('change', () => {
        audio.volume = volume.value / 100;
    });
    timeline.addEventListener('click',  e => {
        const timelineWidth = window.getComputedStyle(timeline).width;
        const timeToSeek = (e.offsetX / parseInt(timelineWidth)) * audio.duration;
        audio.currentTime = timeToSeek;
        songProgress.style.width = `${(audio.currentTime / audio.duration)*100}%`
    }, false)

    next.addEventListener('click', playNextTrack);
    prev.addEventListener('click', playPrevTrack);

    window.addEventListener('popstate', event =>
    {
        loadSection(event.state);
    })
});
