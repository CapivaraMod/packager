<script>
  import Section from './Section.svelte';
  const color = '#3DA00B';
</script>
<style>
  .badge {
    background-color: #3DA00B;
    border-bottom: 2px solid #007317;
    color: white;
    padding: 2px 5px;
    border-radius: 4px;
  }
</style>

<Section accent={color}>
  <div lang="en">
    <p>
      <span class="badge">New!</span>
    </p>
    <p>
      Infinite clones is now actually infinite instead of being limited to 9,999,999,999 (though you may encounter significant practical limitations long before reaching that limit).
    </p>
  </div>
</Section>
