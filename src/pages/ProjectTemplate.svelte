<script>
    import projects from "./projects.js"
    import {getHref} from "../util/util.js"
    import {onMount} from "svelte"

    export let params;
    let projectInfo = {};

    onMount(async()=>{
        console.log("Params", params)

        for(let i=0; i < projects.length; i++){
            let name = getHref(projects[i].name).slice(1)

            if(params.projectName == name){
                projectInfo = projects[i];
            }
        }
    });

    $:console.log("params:", projectInfo)

</script>

<h1>
    {projectInfo.name}
</h1>

<style>

h1{
color: white;
}

</style>