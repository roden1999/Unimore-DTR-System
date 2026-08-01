const model=require('../models/qualityModel');
const handle=fn=>async(req,res)=>{try{await fn(req,res);}catch(error){const duplicate=[2601,2627].includes(error.number);res.status(error.status || (duplicate?409:500)).json({message:duplicate?'Record number is already in use.':error.message});}};
const list=handle(async(req,res)=>res.json(await model.list(req.params.resource)));
const create=handle(async(req,res)=>res.status(201).json(await model.create(req.params.resource,req.body,req.user)));
const update=handle(async(req,res)=>{const row=await model.update(req.params.resource,req.params.id,req.body,req.user);if(!row)return res.status(404).json({message:'Record not found.'});res.json(row);});
const remove=handle(async(req,res)=>{if(!await model.remove(req.params.resource,req.params.id,req.user))return res.status(404).json({message:'Record not found.'});res.json({message:'Record removed.'});});
const dashboard=handle(async(_req,res)=>res.json(await model.dashboard()));
const productionBatches=handle(async(_req,res)=>res.json(await model.productionBatches()));
module.exports={list,create,update,remove,dashboard,productionBatches};
