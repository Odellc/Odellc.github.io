<script>
    import {getHref} from "./util/util.js"
    export let project;
     
</script>

<div class="card">
    <a href={getHref(project.name)}>
    <h3>
       {project.name}
    </h3>
    <div class="image-class">
         <img
            src={project.imageA}
            alt={project.name}/>

    </div>
    </a>
</div>

<style>
    .card{
        width: 300px;
        height: 300px;
        border: 1px solid #aaa;
        border-radius: 3px;
        box-shadow: 2px 2px 10px rgba(255, 255, 255);
        padding: 1em;
    }
    h3{
        padding: 0 0 0.2em 0;
        margin: 0 0 1em 0;
        border-bottom: 1px solid #ff3e00;
    }

    :global(.image-class img){
        width: 150px;
        height: 150px;
    }
</style>