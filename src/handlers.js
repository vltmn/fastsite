const deployHandler = async (name, path, region, stage) => {
    //TODO
    console.log({
        name, path, region, stage
    });
}

const removeHandler = async (name, region, stage) => {
    //TODO
    console.log({
        name, region, stage
    });
}

module.exports = {
    deploy: deployHandler, 
    remove: removeHandler
}