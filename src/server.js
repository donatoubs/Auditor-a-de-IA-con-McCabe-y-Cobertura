const { createApp } = require("./app");

const port = Number(process.env.PORT || 3000);
const app = createApp();

app.listen(port, () => {
  console.log(`Sistema de citas disponible en http://localhost:${port}`);
});
