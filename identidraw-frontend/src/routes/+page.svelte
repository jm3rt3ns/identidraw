<script lang="ts">
	import { onMount } from 'svelte';
	import { io } from 'socket.io-client';
	// import * as fabric from 'fabric';
	import { fabric } from 'fabric';

	const socket = io('http://localhost:3000');

	let lobbyCodeInput = '';
	let messageInputText = '';
	let userNameInput = '';

	interface User {
		name: string;
		id: string;
		canvas: string;
	}

	let messages: { user: User; message: string }[] = [];
	let user = { loggedIn: false, name: '', id: '', canvas: '' };
	let game: { gameCode: string; users: User[] } = { gameCode: '', users: [] };

	function createGame() {
		socket.emit('create game', user.name);
	}

	function joinGame() {
		game.gameCode = lobbyCodeInput;
		socket.emit('join game', { gameCode: game.gameCode, name: user.name });
		user.loggedIn = true;
	}

	function leaveGame() {
		socket.emit('leave room', { gameCode: game.gameCode, user: user });
		game.gameCode = '';
		user.loggedIn = false;
	}

	function sendMessage() {
		socket.emit('chat message', { user: user, message: messageInputText });
		messageInputText = '';
	}

	onMount(() => {
		socket.on('chat message', function (msg) {
			console.log('received message', msg);
			messages = [...messages, msg];
			window.scrollTo(0, document.body.scrollHeight);
		});

		socket.on('new game', function (msg) {
			socket.emit('join game', msg);
			game.gameCode = msg;
			user.loggedIn = true;
		});

		socket.on('new game state', function (msg) {
			console.log(msg);
			game = msg;

			const currentUser: any = game.users.find((userInGame) => userInGame.name === user.name);
			currentUser.loggedIn = true;
			if (currentUser) {
				user = currentUser;
			}
			user.loggedIn = true;
		});

		socket.on('image update', function (msg) {
			console.log(msg);
			console.log(game);
			game.users = game.users.map((user) => {
				if (user.id === msg.id) {
					user.canvas = msg.canvas;
				}
				return user;
			});
		});
	});

	let canv: HTMLCanvasElement;
	const draw = () => {
		// set up canvas for drawing
		let canvas = new fabric.Canvas(canv, {
			isDrawingMode: true
		});
		canvas.isDrawingMode = true;

		console.log(canvas);
		canvas.freeDrawingBrush.width = 5;
		canvas.freeDrawingBrush.color = 'red';

		canvas.on('path:created', (event) => {
			console.log(event);
			//log the svg path  info
			if (canv) socket.emit('new image', { ...user, canvas: canv.toDataURL() });
		});
	};

	$: if (user.loggedIn) {
		console.log('drawing');
		draw();
	}
</script>

<svelte:head>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/500/fabric.min.js"></script>
</svelte:head>

{#if !user.name}
	<div class="bg-white">
		<div class="relative isolate">
			<div class="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
				<div class="inline-grid grid-cols-1 gap-4">
					<input
						type="text"
						bind:value={userNameInput}
						placeholder="Create a username..."
						class="bg-transparent border-none px-4 py-3 w-full"
						on:keydown={(evt) => {
							if (evt.key === 'Enter') {
								user.name = userNameInput;
							}
						}}
					/>
					<button class="btn-blue" on:click={() => (user.name = userNameInput)}>Begin</button>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div
		class="bg-indigo-600 inline-grid grid-cols-2 w-full px-3.5 py-2.5 text-sm font-semibold text-white"
	>
		<div class="inline-flex text-left items-center">
			{#if user.loggedIn}
				<p class="mr-3.5">Lobby Code: {game.gameCode}</p>
				<button on:click={leaveGame} class="btn-red">Leave Game</button>
			{/if}
		</div>
		<div class="text-right">
			<h1>{user.name}</h1>
		</div>
	</div>
	{#if !user.loggedIn}
		<div class="bg-white">
			<div class="relative isolate">
				<div class="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
					<div class="inline-grid grid-cols-1 gap-4">
						<button on:click={createGame} class="btn-blue">Create Game</button>
						<div class="inline-flex">
							<input
								type="text"
								bind:value={lobbyCodeInput}
								placeholder="Enter 4 Digit Lobby Code..."
								class="bg-transparent border-none px-4 py-3"
							/>
							<button on:click={joinGame} class="btn-blue">Join Game</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="inline-grid grid-cols-2">
			<div class="border border-solid">
				<canvas width="250" height="250" bind:this={canv} on:click={draw} />
				<h3>Chat</h3>
				{#each messages as message}
					<div>
						<p>{message.user.name} {message.message}</p>
					</div>
				{/each}
				<input bind:value={messageInputText} placeholder="Type something..." />
				<button on:click={sendMessage} class="btn-blue">Send</button>
			</div>
			<div class="m-3">
				<h2>Current Users</h2>
				<div class="inline-grid grid-cols-3">
					{#each game.users as user}
						<div>
							<p>{user.name}</p>
							<div class="border border-solid">
								<img
									alt={`painting by player ${user.name}`}
									src={user.canvas}
									id="otherPlayerImage"
									width="100"
									height="100"
								/>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
{/if}

<style lang="postcss">
	:global(html) {
		background-color: theme(colors.gray.100);
	}

	.btn-blue {
		@apply rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
	}

	.btn-red {
		@apply rounded-md bg-red-600 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600;
	}
</style>
