const { createApp } = require("./app");

const PORT = 5000;
const app = createApp();

app.listen(PORT, () => {
    console.log(`Argus Server running at http://localhost:${PORT}`);
});
