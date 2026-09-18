<script>
  import { onDestroy } from 'svelte';
  import Button from './Button.svelte';
  import Section from './Section.svelte';
  import {_} from '../locales/';
  import embeddedGuide from '../../static/guia.md';

  export let visible = false;

  let modalElement;
  let content = '';
  let loading = false;
  let loadError = null;
  let initiallyFocusedElement;
  let requestId = 0;

  const escapeHtml = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const renderInline = (value) => {
    let rendered = escapeHtml(value);
    rendered = rendered.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    rendered = rendered.replace(/`([^`]+)`/g, '<code>$1</code>');
    rendered = rendered.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    rendered = rendered.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    rendered = rendered.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    rendered = rendered.replace(/_([^_]+)_/g, '<em>$1</em>');
    return rendered;
  };

  const renderMarkdown = (markdown) => {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const output = [];
    let paragraph = [];
    let list = [];
    let code = [];

    const flushParagraph = () => {
      if (paragraph.length) {
        output.push(`<p>${paragraph.map(renderInline).join('<br>')}</p>`);
        paragraph = [];
      }
    };
    const flushList = () => {
      if (list.length) {
        output.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
        list = [];
      }
    };
    const flushCode = () => {
      if (code.length) {
        output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = [];
      }
    };

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        flushParagraph();
        flushList();
        if (code.length) {
          flushCode();
        } else {
          code.push('');
        }
      } else if (code.length) {
        code.push(line);
      } else if (/^#{1,3}\s+/.test(line)) {
        flushParagraph();
        flushList();
        const match = line.match(/^(#{1,3})\s+(.+)$/);
        output.push(`<h${match[1].length}>${renderInline(match[2])}</h${match[1].length}>`);
      } else if (/^\s*-\s+/.test(line)) {
        flushParagraph();
        list.push(line.replace(/^\s*-\s+/, ''));
      } else if (!line.trim()) {
        flushParagraph();
        flushList();
      } else {
        flushList();
        paragraph.push(line);
      }
    }
    flushParagraph();
    flushList();
    flushCode();
    return output.join('');
  };

  const getMarkdown = async () => {
    const currentRequest = ++requestId;
    loading = true;
    loadError = null;
    try {
      let markdown;
      try {
        const response = await fetch('guia.md');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        markdown = await response.text();
      } catch (fetchError) {
        markdown = embeddedGuide;
      }
      if (currentRequest === requestId) {
        content = renderMarkdown(markdown);
      }
    } catch (error) {
      if (currentRequest === requestId) {
        loadError = error;
        content = '';
      }
    } finally {
      if (currentRequest === requestId) {
        loading = false;
      }
    }
  };

  const close = () => {
    visible = false;
  };

  const onKeyDown = (event) => {
    if (visible && event.key === 'Escape') {
      close();
    }
  };

  $: if (visible) {
    document.body.setAttribute('p4-modal-visible', '');
    initiallyFocusedElement = document.activeElement;
    getMarkdown();
  } else if (initiallyFocusedElement) {
    document.body.removeAttribute('p4-modal-visible');
    initiallyFocusedElement.focus();
    initiallyFocusedElement = null;
  }

  $: if (visible && modalElement) {
    const closeButton = modalElement.querySelector('button');
    if (closeButton) {
      closeButton.focus();
    }
  }

  onDestroy(() => {
    requestId++;
  });
</script>

<svelte:window on:keydown={onKeyDown} />

{#if visible}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="guide-title" on:click|self={close} bind:this={modalElement}>
    <Section modal>
      <div class="header">
        <h2 id="guide-title">{$_('p4.guia')}</h2>
        <button class="close" type="button" on:click={close} aria-label={$_('p4.close')}>×</button>
      </div>
      <div class="content">
        {#if loading}
          <p>{$_('p4.loadingGuide')}</p>
        {:else if loadError}
          <p>{$_('p4.guideError')}</p>
        {:else}
          {@html content}
        {/if}
      </div>
      <Button on:click={close} text={$_('p4.close')} />
    </Section>
  </div>
{/if}

<style>
  :global([p4-modal-visible]) {
    overflow: hidden;
  }
  .modal {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.75);
    word-break: break-word;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .header h2 {
    margin: 0;
  }
  .close {
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 1.75rem;
    line-height: 1;
    cursor: pointer;
  }
  .content {
    max-height: 60vh;
    overflow-y: auto;
    text-align: left;
  }
  .content :global(pre) {
    padding: 0.75rem;
    overflow-x: auto;
    background: rgba(127, 127, 127, 0.15);
    border-radius: 4px;
  }
  .content :global(code) {
    font-family: monospace;
  }
</style>
