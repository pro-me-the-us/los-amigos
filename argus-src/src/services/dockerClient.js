const Docker = require("dockerode");
const docker = new Docker();

async function pullImage(image) {
    return new Promise((resolve, reject) => {
        docker.pull(image, (err, stream) => {
            if (err) return reject(err);

            docker.modem.followProgress(stream, (err) =>
                err ? reject(err) : resolve()
            );
        });
    });
}

async function runContainer(imageName, version, containerName, port) {
    const image = `${imageName}:${version}`;

    async function imageExists(image) {
    const images = await docker.listImages();
    return images.some(img =>
        img.RepoTags && img.RepoTags.includes(image)
    );
    }

    if (!(await imageExists(image))) {
        await pullImage(image);
    }

    const container = await docker.createContainer({
        Image: image,
        name: containerName,
        ExposedPorts: { "3000/tcp": {} },
        HostConfig: {
            PortBindings: {
                "3000/tcp": [{ HostPort: port.toString() }]
            }
        }
    });

    await container.start();

    return container;
}

async function stopAndRemove(containerName) {
    try {
        const container = docker.getContainer(containerName);
        await container.stop();
        await container.remove();
    } catch (err) {}
}

module.exports = { runContainer, stopAndRemove };