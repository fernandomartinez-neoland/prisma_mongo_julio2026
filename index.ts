import express from 'express'
import router from './src/routes/user.route';

const app = express()
app.use(express.json())
const port = 3000;

app.get('/', (req, res) => {
    res.send("respuesta")
})

app.use('/users', router)
app.listen(port, () => {
    console.log('http://localhost:' + port)
})