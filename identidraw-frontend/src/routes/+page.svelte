<script lang="ts">
	import { onMount } from 'svelte';
	import { io } from 'socket.io-client';

	const socket = io('http://localhost:3000');

	let messages: string[] = [];
	let lobbyCodeInput = '';

	let user = { loggedIn: false };
	let game = { lobbyCode: '' };
	function toggle() {
		user.loggedIn = !user.loggedIn;
	}

	function createGame() {
		socket.emit('create game');
	}

	function joinGame() {
		socket.emit('join game', lobbyCodeInput);
		game.lobbyCode = lobbyCodeInput;
	}

	function leaveGame() {
		socket.emit('leave room', game.lobbyCode);
	}

	onMount(() => {
		socket.on('chat message', function (msg) {
			messages.push(msg);
			window.scrollTo(0, document.body.scrollHeight);
		});

		socket.on('new game', function (msg) {
			user.loggedIn = true;
			game.lobbyCode = msg;

			socket.emit('join game', msg);
		});
	});
</script>

{#if !user.loggedIn}
	<button on:click={createGame}>Create Game</button>
	<input
		type="text"
		bind:value={lobbyCodeInput}
		placeholder="Type something..."
		class="bg-transparent border-none px-4 py-3 w-full"
	/>
	<button on:click={joinGame}>Join Game</button>
{:else}
	<h2>Lobby Code: {game.lobbyCode}</h2>
	<button on:click={leaveGame}>Leave Game</button>
	{#each messages as message}
		<div>
			<p>{message}</p>
		</div>
	{/each}
{/if}
