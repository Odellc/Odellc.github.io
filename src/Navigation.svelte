<script>
  import Disclaimer from "./Disclaimer.svelte";

  function changeBackground(e) {
    let yScroll = window.scrollY;

    if (yScroll > 0) {
      document.querySelector("nav").style.background = "black";
    } else if (yScroll == 0) {
      document.querySelector("nav").style.background = null;
    }
  }
</script>

<svelte:window on:scroll={e => changeBackground(e)} />

<nav>
  <a href="#home">Home</a>
  <a href="#about">About</a>
  <a href="#proficiencies">Proficiencies</a>
  <a href="#projects">Projects</a>
  <a href="#contact">Contact</a>
  <a href="#contact">Hire Me!</a>
  <Disclaimer />
</nav>

<style>
  nav {
    display: flex;
    justify-content: center;
    gap: 20px;
    align-items: center;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 100;
  }

  a {
    padding: 5px;
    color: white;
    border-bottom: 5px solid rgba(0, 0, 0, 0);
    font-weight: 600;
  }

  a:last-of-type {
    color: #99b946;
    font-weight: 600;
  }

  a:hover {
    cursor: pointer;

    border-bottom: 5px solid red;
    font-weight: 600;
  }
</style>
