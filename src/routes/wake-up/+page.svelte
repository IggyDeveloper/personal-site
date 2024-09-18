<script lang="ts">
  const MESSAGE_DELAY_MS = 1500;
  const FLICKER_DELAY_MS = 100;

  const allMessages = [
    'WAKE UP!!!!!!!',
    'this message is a crack through the convulted net of delusions your mind has imposed upon you',
    'cogito, ergo sum or smth like that idk'
  ];

  let visibleMessages: string[] = [];
  let isBgColorInverted = false;

  const playBgEffectRecursive = (index: number) => {
    if (index > 10) {
      window.location.href = '/';
    }

    isBgColorInverted = !isBgColorInverted;
    setTimeout(() => playBgEffectRecursive(index + 1), FLICKER_DELAY_MS);
  };

  const addMessageRecursive = (index: number) => {
    const message = allMessages[index];
    if (message) {
      visibleMessages = [...visibleMessages, message];
      setTimeout(() => addMessageRecursive(index + 1), MESSAGE_DELAY_MS);
      return;
    }

    playBgEffectRecursive(0);
  };

  addMessageRecursive(0);
</script>

<main
  class={`flex flex-col justify-center items-center h-screen ${isBgColorInverted ? 'bg-white' : 'bg-black'}`}
>
  {#each visibleMessages as message}
    <p class={isBgColorInverted ? 'text-black' : 'text-white'}>{message}</p>
  {/each}
</main>
