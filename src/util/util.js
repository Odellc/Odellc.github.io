export const getHref = (name) => {
        return "/" + name.split(" ").map(x => x.toLowerCase()).join("-");
    };