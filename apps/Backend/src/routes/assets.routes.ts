import express, {type Request, type Response} from 'express';
import {supportedAssets} from '../constant/assets.js'
const assetRouter = express.Router()

assetRouter.get('/', async (req:Request, res:Response)=>{
    res.json(supportedAssets)
})

export default assetRouter;