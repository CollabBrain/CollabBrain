import express, { Express } from "express";
import dotenv from "dotenv"
import clientRoutes from "./routes/client/index.route";

dotenv.config()

const app: Express = express()
app.use(express.json())
app.use(express.urlencoded({extended: true}))

clientRoutes(app);

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
  console.log(`App is listening on ${PORT}`)
})
