const Clicks = require("../model/Clicks");
const Links = require("../model/Links");
const axios = require('axios');
const Users = require('../model/Users');
const { getDeviceInfo } = require('../utils/linksUtility')

const linksController={
    create:async(request,response)=>{
        const {campaign_title,original_url,category}=request.body;
        try{

            const user= await Users.findById({_id: request.user._id});
            if(user.credits < 1){
                return response.status(400).json({message: 'Insufficient credits'});
            }


            const link=new Links({
                campaignTitle: campaign_title,
                originalUrl: original_url,
                category: category,
                user: request.user.role === 'admin'? request.user.id: request.user.adminId
            });


            await link.save();

            user.credits -= 1; // Deduct one credit for creating a link
            await user.save();

            
            response.status(200).json({
                data:{id: link._id},
                message:'Link Created'
            })
        }catch(error){
            console.log(error);
            return response.status(500).json({error:"Internal server error"})
        }
    },

    getAll:async(request,response)=>{
        try{

            const {
                currentPage = 0, 
                pageSize= 10, 
                searchTerm = '',
                sortField='createdAt', 
                sortOrder = 'desc'
            } = request.query;

            const userId = request.user.role === 'admin' ? request.user.id : request.user.adminId;

            const skip = parseInt(currentPage) * parseInt(pageSize);
            const limit = parseInt(pageSize);
            const sort = { [sortField]: sortOrder === 'desc' ? -1 : 1 };

            const query = {
                user: userId
            };

            if (searchTerm) {
                query.$or = [
                    { campaignTitle: new RegExp(searchTerm, 'i') },
                    { category: new RegExp(searchTerm, 'i') },
                    { originalUrl: new RegExp(searchTerm, 'i') }
                ];
            }

            const links = await Links.find(query)
                .sort(sort).skip(skip).limit(limit);
            
            const total = await Links.countDocuments(query);
            
            response.json({ data: {links,total} });

        }catch(error){
            console.log(error);
            return response.status(500).json({error:"Internal server error"})
        }
    },

    getById:async(request,response)=>{
        try{
            const linkId = request.params.id;
            if(!linkId){
                return response.status(401).json({error:"Link id is required"});
            }

            const link = await Links.findById(linkId);
            if(!link){
                return response.status(404).json({error:"Link does not exist with the given id"});
            }

            const userId = request.user.role === 'admin'?request.user.id:request.user.adminId;
            if(link.user.toString() !== userId){
                return response.status(403).json({error:"Unauthorized access"})
            }

            response.json({data: link});
        }catch(error){
            console.log(error);
            return response.status(500).json({error:"Internal server error"})
        }
    },

    update:async(request,response)=>{
        try{
            const linkId = request.params.id;
            if(!linkId){
                return response.status(401).json({error:"Link id is required"});
            }

            let link = await Links.findById(linkId);
            if(!link){
                return response.status(404).json({error:"Link does not exist with the given id"});
            }
           
            const {campaign_title,original_url,category}=request.body;
            link=await Links.findByIdAndUpdate(linkId,{
                campaignTitle: campaign_title,
                originalUrl: original_url,
                category: category
            },{new: true});

            response.json({data: link});
        }catch(error){
            console.log(error);
            return response.status(500).json({error:"Internal server error"})
        }
    },

    delete:async(request,response)=>{
        try{
            const linkId = request.params.id;
            if(!linkId){
                return response.status(401).json({error:"Link id is required"});
            }

            let link = await Links.findById(linkId);
            if(!link){
                return response.status(404).json({error:"Link does not exist with the given id"});
            }
            const userId = request.user.role === 'admin'?request.user.id:request.user.adminId;
            if(link.user.toString() !== userId){
                return response.status(403).json({error:"Unauthorized access"})
            }

            await link.deleteOne();
            response.json({message: 'Link deleted'});
        }catch(error){
            console.log(error);
            return response.status(500).json({error:"Internal server error"})
        }
    },

    redirect:async(request,response)=>{
        try{
            const linkId = request.params.id;
            if(!linkId){
                return response.status(401).json({error:"Link id is required"});
            }

            const link = await Links.findById(linkId);
            if(!link){
                return response.status(404).json({error:"Link does not exist with the given id"});
            }

            const isDevelopment = process.env.NODE_ENV === 'development';
            const ipAddress = isDevelopment
                ? '8.8.8.8'
                :request.headers['x-forwaded-for']?.split(',')[0] || request.socket.remoteAddress;
            
            const geoResponse = await axios.get(`http://ip-api.com/json/${ipAddress}`);
            const {city, country, region, lat, lon, isp} = geoResponse.data;

            const userAgent = request.headers['user-agent'] || 'Unknown';
            const {deviceType, browser} = getDeviceInfo(userAgent);

            const referrer = request.get('Referrer') || null;

            await Clicks.create({
                linkId: link._id,
                ip: ipAddress,
                city: city,
                country: country,
                region: region,
                latitude: lat,
                longitude: lon,
                isp: isp,
                referrer: referrer,
                userAgent: userAgent,
                deviceType: deviceType,
                browser: browser,
                clickedAt: new Date()
            })
            
            link.clickCount+=1;
            await link.save();

            response.redirect(link.originalUrl);
        }catch(error){
            console.log(error);
            return response.status(500).json({error:"Internal server error"})
        }
    },
    analytics: async(request,response)=>{
        try{
            const {linkId, from, to}=request.query;

            const link = await Links.findById(linkId);
            if(!link){
                return response.status(404).json({
                    error:'Link not found'
                });
            }

            const userId = request.user.role === 'admin'
                ? request.user.id
                : request.user.adminId;
            if(link.user.toString() !== userId){
                return response.status(403).json({error: 'Unauthorized access'})
            }

            const query = {
                linkId: linkId
            };

            if(from && to){
                query.clickedAt = {$gte: new Date(from), $lte: new Date(to)};
            }

            const data = await Clicks.find(query).sort({clickedAt: -1});
            response.json(data);
        }catch(error){
            console.log(error);
            response.status(500).json({
                message:'Internal server error'
            });
        }
    }
};

module.exports = linksController;