const express = require("express")
const app = express()
const routes =  express.Router();


app.use(express.urlencoded({extended: false}))
app.use(express.json())



const PORT = process.env.PORT || 5000
app.use('/', routes)

app.get('/test', (req,res) => res.send('Hello World'))
app.listen(PORT, () => {
    console.log("Server is running....")
})