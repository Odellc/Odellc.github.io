<script>
  import Proficiencies from "../Proficiencies.svelte";
  import About from "../About.svelte"
  import Projects from "../Projects.svelte"
  import Contact from "../Contact.svelte"

   let projectFilter = null;

   $: console.log("ProjectFilter", projectFilter)

</script>

<main>
  <section class="start" style="background-image: url(./assets/background.jpg);" id="home">
    <!-- <div class="name">
      <p class="name_tag"></p>
    </div> -->
    <h1 class="name">Christopher Odell</h1>
    <h2 class="open">
      Data Analytics Management | Data scientist | Data Engineer
    </h2>
  </section>

  <section  class="about" id="about">
    <h3>Let me introduce myself!</h3>
    <About/>
  </section>

  <section class="main_section container" id="proficiencies">
    <h3>Here are some of my Proficiencies</h3>
      
      <Proficiencies bind:projectFilter/>
  </section>
  
  <section class="projects" id="projects">
    <h3>Here is a glimpse of some of my projects</h3>
    <Projects bind:projectFilter/>
  </section>
  <section class="contact" id="contact">
    <h3>I would love to connect!</h3>
    <Contact/>
  </section>

</main>

<style>
  main {
    /* height: 100vh; */
    overflow: auto;
    flex-direction: column;
    display: flex;
  }

  .start {
    display: grid;
    width: 100%;
    color: white;
    min-height: 500px;
    background-size: cover;
    height: 100vh;
    align-content: center;
    text-align: center;
  }

  .name {
    color: #99b946;
    text-align: center;
    font-family: Georgia;
    font-weight: 600;
    vertical-align: middle;
    font-size: 4rem;
    padding: 10px;
    /* opacity: 50%; */
  }

  .start .open {
    position: relative;
  }

  h3{
    display: flex;
    color: #99b946;
    /* text-align: center; */
    justify-content: center;
    align-items: center;
    padding: 0 0 0.4em 0;
    margin: 0 0 1em 0;
    border-bottom: 1px solid white;
    font-size: 2em;

  }


  .container {
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 25px;
  }

  section{
    margin-bottom: 50px;
  }

  .about {
    flex: 1;
    justify-content: center;
    font-weight: 600;
    padding: 25px;
  }

  .projects{
    /* display: flex;
    flex-direction: row; */
    justify-content: center;
    align-items: center;
    padding: 25px;
  }
</style>
