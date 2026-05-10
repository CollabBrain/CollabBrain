import expess, { Express } from "express";
import dotenv from "dotenv"
import clientRoutes from "./routes/client/index.route";
dotenv.config()
const app: Express = expess()


clientRoutes(app);
const PORT = process.env.PORT || 3000
app.use(expess.json())
app.use(expess.urlencoded({extended: true}))

app.listen(PORT, ()=>{
  console.log(`App is listening on ${PORT}`)
})