import hello from './js/say.js'
import { message, weather } from './js/message.js'
import './css/main.css'

hello(message)

hello(`今天的天气是：${weather}`)