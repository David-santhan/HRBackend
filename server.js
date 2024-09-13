const express= require("express");
const cors = require("cors");
const router = express.Router();
const mongoose = require("mongoose");
const multer=require("multer");
const { type } = require("os");
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { error } = require("console");
const jwt = require('jsonwebtoken');
const nodemailer=require('nodemailer');
const { inflate } = require("zlib");
const { truncate } = require("fs");
dotenv.config()



// email Config

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
})

const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type'));
    }
});


const app =express();
app.use(express.json());


// app.use(express.static('public'))
const corsOptions = {
    origin: 'https://frontend-theta-mocha-38.vercel.app',
    credentials: true,
  };
  
  app.use(cors(corsOptions));

const allowedOrigins = ['http://localhost:3000', 'https://frontend-theta-mocha-38.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin like mobile apps or curl requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: "Content-Type,Authorization"
}));
app.options('*', cors());  // Preflight requests

res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');  // Use requested origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

  
app.use("/www", express.static("uploads"));
app.use('/uploads', express.static('uploads'));
app.listen(process.env.PORT,()=>{
    console.log("Listening to Port 7993");
});

let ConnectedtoMDB= async()=>{
    try{
        await mongoose.connect("mongodb+srv://OrnnovaHRMangement:OrnnovaHRMangement@ornnovahrmanagment.qu6ub6f.mongodb.net/HRManagment?retryWrites=true&w=majority&appName=OrnnovaHRManagment");
        console.log("Succesfuly Connected to MDB ✅");
    }catch{
        console.log("Failed to Connect to MDB ❌");
    }
}

 ConnectedtoMDB();
 
 let userSchema = new mongoose.Schema({
    EmpCode: {
        type: String,
        required: true,
    },
    EmployeeName: {
        required: true,
        type: String,
    },
    Email: {
        required: true,
        type: String,
    },
    Password: {
        required: true,
        type: String,
    },
    UserType: {
        required: true,
        type: String,
    },
    ProfilePic: {
        type: String,
    },
    Status: {
        type: String,
    },
    verifytoken: {
        type: String,
    },
    token: {
        type: String,
    },
    CreatedBy: {
        type: String,
    },
    Team: [
        { 
            type:String
        }
    ],
    Clients: [
        {
            type: mongoose.Schema.Types.ObjectId,  // Use ObjectId if you are working with ObjectIds
            ref: 'Client' // Replace 'Client' with the actual reference model name if needed
        }
    ],
    Requirements:[
        {
          type:mongoose.Schema.Types.ObjectId,
          ref: 'Requirements'
        }
    ],
    claimedRequirements: [{ type: mongoose.Schema.Types.ObjectId, ref: "NewRequirement" }]
});

 let NewUser = new mongoose.model("Users",userSchema);

 app.get("/loggedinuserdata/:email",async(req,res)=>{
    
    let loggedinuserdata = await NewUser.find({Email:req.params.email})
    res.json(loggedinuserdata);
 })

app.post("/newUser",upload.array("ProfilePic"),async(req,res)=>{

    let userArr=await NewUser.find().and({Email:req.body.Email});
    if (userArr.length>0) {
        res.json({status:"failure",msg:"Email already Exist❌"});
    }else{
    try{
        let newUser = new NewUser({          
            EmpCode:req.body.EmpCode,
            EmployeeName:req.body.EmployeeName,
            Email:req.body.Email,
            Password:req.body.Password,
            UserType:req.body.UserType,
            ProfilePic:req.files[0].path,
            Status:req.body.Status,
            token:req.body.Token,
            CreatedBy:req.body.CreatedBy,
            Team:req.body.Team

        });
        await newUser.save();
        res.json({status:"Success",msg:" User Created Successfully✅"});
    }catch(error){
        res.json({status:"Failed",error:error,msg:"Invalid Details ❌"});
        console.log(error)
    }
    }
}
);
app.get("/userDetailsHome",async(req,res)=>{ 
    // to get only usertype having only user 
    // let userDetailshome=await NewUser.find({UserType:"User"});
    let userDetailshome=await NewUser.find();
    res.json(userDetailshome);
})

// Assign Clients to Users
app.get('/userDetailstoAssignClient/:clientId', async (req, res) => {
    const clientId = req.params.clientId;
    
    try {
        // Find users who do not have the specified client ID in their Clients array
        const userDetails = await NewUser.find({
            UserType: { $in: ["User", "TeamLead"] },
            Clients: { $ne: clientId }  // $ne operator excludes users with the clientId in Clients array
        });

        res.json(userDetails);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

app.get('/userDetailsofAssignedClient/:clientId', async (req, res) => {
    const clientId = req.params.clientId;
    
    try {
        // Find users who do not have the specified client ID in their Clients array
        const userDetails = await NewUser.find({
            UserType: { $in: ["User", "TeamLead"] },
            Clients: { $in: clientId }  // $ne operator excludes users with the clientId in Clients array
        });

        res.json(userDetails);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// Assign Requirement to Users
app.get('/userDetailstoAssignRequirement/:reqId/:userId', async (req, res) => {
    const { reqId, userId } = req.params;
    
    try {
        // Find the user with the provided userId
        const user = await NewUser.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get the user's Team array (assuming it's an array of user IDs)
        const teamIds = user.Team; // This is an array of user IDs

        // Find the users in the Team who do not have the specified reqId in their Requirements array
        const teamMembers = await NewUser.find({
            _id: { $in: teamIds }, // Find users whose IDs are in the Team array
            UserType: { $in: ["User"] },
            Requirements: { $ne: reqId }  // Exclude users who already have this reqId in their Requirements array
        });

        res.json(teamMembers);  // Return the details of the team members
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});


app.get('/userDetailsofAssignedRequirement/:reqId', async (req, res) => {
    const reqId = req.params.reqId;
    
    try {
        // Find users who do not have the specified client ID in their Clients array
        const userDetails = await NewUser.find({
            UserType: { $in: ["User"] },
            Requirements: { $in: reqId }  // $ne operator excludes users with the clientId in Clients array
        });

        res.json(userDetails);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// Route to get users with UserType 'User'
app.get("/getUserDataToADDtoTeam", async (req, res) => {
    try {
        // Step 1: Get the list of all userIds that are in any Team array
        const usersWithTeams = await NewUser.find({ "Team": { $exists: true, $ne: [] } }, "Team");

        // Extract all the userIds from the Team arrays
        let userIdsInTeams = usersWithTeams.flatMap(user =>
            user.Team
                .filter(id => id) // Ensure id is defined
                .map(id => id.toString())
        );

        // Filter out any empty or invalid ObjectId strings
        userIdsInTeams = userIdsInTeams.filter(id => id && mongoose.Types.ObjectId.isValid(id));

        // Query to get users where UserType is 'User' and their _id is not in the Team array
        const userDetails = await NewUser.find({
            UserType: "User",
            _id: { $nin: userIdsInTeams }
        });

        // Respond with the filtered user details as JSON
        res.json(userDetails);
    } catch (err) {
        // Handle errors (e.g., database issues)
        console.error("Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post("/login",upload.none(),async(req,res)=>{
console.log(req.body);

let fetchedData= await NewUser.find().and({Email:req.body.Email});
console.log(fetchedData);
if(fetchedData.length>0){
    if(fetchedData[0].Password == req.body.Password){
        if(fetchedData[0].UserType == req.body.UserType){
            // req.session.userId = fetchedData[0]._id;
            let dataToSend={
                EmpCode:fetchedData[0].EmpCode,
            EmployeeName:fetchedData[0].EmployeeName,
            Email:fetchedData[0].Email,
            UserType:fetchedData[0].UserType,
            ProfilePic:fetchedData[0].ProfilePic,
            Status:fetchedData[0].Status,
            Id:fetchedData[0]._id,
            ClaimedRequirements:fetchedData[0].claimedRequirements,
            Token:fetchedData[0].tokenVersion
            }
            res.json({status:"Success",msg:"Login Successfully ✅",data:dataToSend});
             
        }else{
            res.json({status:"Failed",msg:"Invalid User ❌"})
        }
    }else{
        res.json({status:"Failed",msg:"Invalid Password ❌"})
    }
    

}else{
    res.json({status:"Failed",msg:"User Does Not Exist ❌"})
}
})

const secretKey = process.env.SECRET_KEY;

app.post("/sendpasswordlink",async (req,res)=>{
    console.log(req.body);
    const {email} = req.body;

    if (!email) {
        res.status(401).json({status:401,message:"Enter Your Email"})
    }
    try {
        const userfind = await NewUser.findOne({Email:email});
        
        // token generate for reset password

        const token = jwt.sign({_id:userfind._id},secretKey,{expiresIn:"300s"});
        
        const setusertoken = await NewUser.findByIdAndUpdate({_id:userfind._id},{verifytoken:token},{new:true});
         
        if (setusertoken) {
            const mailOptions = {
                from:process.env.EMAIL,
                to:email,
                subject:"Password Reset Link",
                text:`This link is valid for 5minutes http://localhost:3000/ResetPassword/${userfind.id}/${setusertoken.verifytoken}`
            }

            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
                    console.log("Error",error);
                    res.status(401).json({status:401,message:"Email Not Send"})
                }else{
                    console.log("Email Sent",info.response);
                    res.status(201).json({status:201,message:"Email Sent Successfully"})
                }
            })
        }
        
    } catch (error) {
        res.status(401).json({status:401,message:"Invalid User"})

    }
})
//  verify user for forgot password

app.get("/ResetPasswordpage/:id/:token",async(req,res)=>{
    const {id,token} = req.params;
    try {
        const validuser = await NewUser.findOne({_id:id,verifytoken:token});
        const verifyToken = jwt.verify(token,secretKey);
        console.log(verifyToken)
        if (validuser && verifyToken._id){
             res.status(201).json({status:201,validuser})
        }else{
            res.status(401).json({status:401,message:"User Not Exist"})

        }
    } catch (error) {
        res.status(401).json({status:401,error })

    }
})

//  Change Password
app.post("/:id/:token",async(req,res)=>{
    const {id,token} = req.params;
    const{password} = req.body;
    try{
        const validuser = await NewUser.findOne({_id:id,verifytoken:token});
        const verifyToken = jwt.verify(token,secretKey);

        if (validuser && verifyToken._id) {
            // const newpassword = await bcrypt.hash(password,12);
            const newpassword = await (password);
            const setnewuserpass = await NewUser.findByIdAndUpdate({_id:id},{Password:newpassword})
         setnewuserpass.save();
         res.status(201).json({status:201,setnewuserpass})
        }else{
            res.status(401).json({status:401,message:"User Not Exist"})

        }
    }catch(error){
        res.status(401).json({status:401,error })
    }
})

app.delete("/deleteUser/:id",async(req,res)=>{
    console.log(req.params.id);
    try {
      await NewUser.deleteMany({_id:req.params.id});
    res.json({status:"success",msg:`User Deleted Successfully✅`});
    } catch (error) {
      res.json({status:"failure",msg:"Unable To Delete ❌",error:error});
    }
    
   });

app.get("/getUserData/:id", async (req, res) => {
    try {
        // Find the user by the given ID
        const user = await NewUser.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Extract the Team array (which contains user IDs)
        const teamUserIds = user.Team;

        // Find the details of all users whose IDs are in the Team array
        const teamUserDetails = await NewUser.find({ _id: { $in: teamUserIds } });

        // Combine user data and team details into a single response object
        const response = {
            userDetails: user,
            teamDetails: teamUserDetails
        };

        // Respond with the combined user and team details
        res.json(response);
    } catch (err) {
        console.error("Error fetching user data:", err);
        res.status(500).json({ msg: "Internal Server Error" });
    }
});



 app.get("/getUserdatatoUpdate/:id",async(req,res)=>{
    let userdetails = await NewUser.findById({_id:req.params.id});
    res.json(userdetails); 
 }) 

// Assuming you are using Express and Mongoose

app.put('/updateUser/:id', async (req, res) => {
    const { id } = req.params;
    const { name, Code, email, status, usertype, profile, Team } = req.body;

    try {
        // Fetch the current user
        const currentUser = await NewUser.findById(id);

        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Merge new team members with existing ones if usertype is "TeamLead"
        const teamObjectIds = usertype === "TeamLead" 
            ? Array.from(new Set([
                ...currentUser.Team, // Existing team members
                ...Team.map(userId => new mongoose.Types.ObjectId(userId)) // New team members
            ]))
            : currentUser.Team; // No change if usertype is not "TeamLead"

        // Update user
        const updatedUser = await NewUser.findByIdAndUpdate(
            id,
            { 
                EmployeeName: name,
                EmpCode: Code,
                Email: email,
                Status: status,
                UserType: usertype,
                ProfilePic: profile,
                Team: teamObjectIds // Correctly set Team
            },
            { new: true } // Return the updated document
        );

        if (updatedUser) {
            res.json({ msg: 'User updated successfully', updatedUser });
        } else {
            res.status(404).json({ msg: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error updating user' });
    }
});

let clientSchema= new mongoose.Schema({
    ClientCode:{
        required:true,
        type:String,
        unique:true,
    },
  
    ClientName:{
        required:true,
         type:String,
    },
    Services:{
        required:true,
        type:String,    
    },
    Location:{
        required:true,
        type:String,
    },
    Name:{
        // required:true,
        type:String,
    },
    Spoc:{
        // required:true,
        type:String,
    },
    MobileNumber:{
        // required:true,
        type:Number,
    },
    Email:{
        // required:true,
        type:String,
    },
    Name1:{
        type:String,
    },
    Spoc1:{
        type:String,
    },
    MobileNumber1:{
        type:Number,
    },
    Email1:{
        type:String,
    },
    Name2:{
        type:String,
    },
    Spoc2:{
        type:String,
    },
    MobileNumber2:{
        type:Number,
    },
    Email2:{
        type:String,
    },
    Assign:[
        {
            type:String,
        }
    ]
 });

 let NewClient = new mongoose.model("Clients",clientSchema);

 app.post("/addClient",upload.none(),async(req,res)=>{ 
    let ClientArr=await NewClient.find().and({ClientCode:req.body.ClientCode});
    if (ClientArr.length>0) {
        res.json({status:"failure",msg:"Client Code already Exist❌"});
    }else{
    try{
        let newClient = new NewClient({
          ClientCode:req.body.ClientCode,
          ClientName:req.body.ClientName,
          Services:req.body.Services,
          Location:req.body.Location,
          Name:req.body.Name,
          Spoc:req.body.Spoc,
          MobileNumber:req.body.MobileNumber,
          Email:req.body.Email, 
          Name1:req.body.Name1,
          Spoc1:req.body.Spoc1,
          MobileNumber1:req.body.MobileNumber1,
          Email1:req.body.Email1,
          Name2:req.body.Name2,
          Spoc2:req.body.Spoc2,
          MobileNumber2:req.body.MobileNumber2,
          Email2:req.body.Email2,
          
        });
        await newClient.save();
        console.log(req.body);
        res.json({status:"Success",msg:" Client Created Successfully✅"});
    }catch(error){
        res.json({status:"Failed",error:error,msg:"Invalid Details ❌"});
        console.log(error);       
    }
    }
}
);

app.get("/ClientsList",async(req,res)=>{
    let ClientsList = await NewClient.find();
    res.json(ClientsList);
})

app.get("/ClientsList/:id",async(req,res)=>{
    let ClientsList = await NewClient.find({_id:req.params.id});
    res.json(ClientsList);
})

app.get("/clientDetails",async(req,res)=>{   
    let clientdetails = await NewClient.find();
    res.json(clientdetails);
})

app.delete("/deleteClient/:id",async(req,res)=>{
    console.log(req.params.id);
    try {
      await NewClient.deleteMany({_id:req.params.id});
    res.json({status:"success",msg:`Client Deleted Successfully✅`});
    } catch (error) {
      res.json({status:"failure",msg:"Unable To Delete ❌",error:error});
    }
    
   });

 app.get("/getClientdatatoUpdate/:id",async(req,res)=>{
    let clientdetails = await NewClient.findById({_id:req.params.id});
    res.json(clientdetails); 
 })  
app.put("/UpdateClient/:id", async(req,res)=>{
    console.log(req.params.id);
    try {
        if(req.body.ClientCode.length>0){
          await NewClient.updateOne({_id:req.body.id},
            {ClientCode:req.body.ClientCode});
        }
        if(req.body.ClientName.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {ClientName:req.body.ClientName});
          }
          if(req.body.Services.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {Services:req.body.Services});
          }
          if(req.body.Location.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {Location:req.body.Location});
          }
          if(req.body.Email.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {Email:req.body.Email});
          }
          if(req.body.Email1.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {Email1:req.body.Email1});
          }
          if(req.body.Email2.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {Email2:req.body.Email2});
          }
          if(req.body.MobileNumber.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {MobileNumber:req.body.MobileNumber});
          }
          if(req.body.MobileNumber1.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {MobileNumber1:req.body.MobileNumber1});
          }
          if(req.body.MobileNumber2.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {MobileNumber2:req.body.MobileNumber2});
          }
          if(req.body.Name.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {Name:req.body.Name});
          }
          if(req.body.Name1.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {Name1:req.body.Name1});
          }
          if(req.body.Name2.length>0){
            await NewClient.updateOne({_id:req.body.id},
              {Name2:req.body.Name2});
          }
          if(req.body.Spoc.length>0){
            await NewClient.updateOne({_id:req.body.id},
              { Spoc:req.body. Spoc});
          }
          if(req.body.Spoc1.length>0){
            await NewClient.updateOne({_id:req.body.id},
              { Spoc1:req.body. Spoc1});
          }
          if(req.body.Spoc2.length>0){
            await NewClient.updateOne({_id:req.body.id},
              { Spoc2:req.body. Spoc2});
          }
        res.json({status:"success",msg:" Details Updated Successfully✅"});
        
      } catch (error) {
        res.json({status:"failure",msg:"Didn't Updated all ☹️"});
        console.log(error);
      }
})

const RequirementSchema = new mongoose.Schema({
    regId: {
        type: String,
        required: true
    },
    client: {
        type: String,
        required: true
    },
    typeOfContract: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    sourceCtc: {
        type: String,
        required: true
    },
    qualification: {
        type: String,
        required: true
    },
    yearsExperience: {
        type: String,
        required: true
    },
    relevantExperience: {
        type: String,
        required: true
    },
    skill: {
        type: String,
        required: true
    },
    requirementtype:{
      type:String,
      required:true
    },
    // assessments: [AssessmentSchema]
    assessments: [
        {
            assessment: {
                type: String,
                required: true
            },
            yoe: {
                type: String,
                required: true
            }
        }
    ],
    uploadedBy:{
        type:String,
    },
    clientId:{
        type:String,
    },
    update:{
        type:String,
        default:"New"
    },
    uploadedDate: {
        type: Date,
        default: Date.now
    },
    claimedBy: [{ userId: String, claimedDate: Date }]   
});
let NewRequirment = new mongoose.model("Requirements",RequirementSchema);

app.post("/newRequirment",upload.none(),async(req,res)=>{ 
    // let RegID=await NewRequirment.find().and({reqId:req.body.reqId});
    // if (RegID.length>0) {
    //     res.json({status:"failure",msg:"Reg ID already Exist❌"});
    // }else{
    try{
          const{
            assessments
          } = req.body;
        // Ensure assessments is an array of objects
const formattedAssessments = Array.isArray(assessments) ? assessments.map(item => ({
    assessment: item.assessment || "",
    yoe: item.yoe || ""
  })) : [];

        let newRequirment = new NewRequirment({
          regId:req.body.regId,
          client:req.body.client,
          typeOfContract:req.body.typeOfContract,
          startDate:req.body.startDate,
          duration:req.body.duration,
          location:req.body.location,
          sourceCtc:req.body.sourceCtc,
          qualification:req.body.qualification,
          yearsExperience:req.body.yearsExperience,
          relevantExperience:req.body.relevantExperience,
          skill:req.body.skill,
          requirementtype:req.body.requirmentType,
          update:req.body.update,
          uploadedBy:req.body.uploadedBy,
          clientId:req.body.clientId,
        assessments:formattedAssessments
        });
        await newRequirment.save();
        console.log(req.body);
        res.json({status:"Success",msg:" Requirment Added Successfully✅"});
    }catch(error){
        res.json({status:"Failed",error:error,msg:"Invalid Details ❌"});
        console.log(error);       
    }
    }
);

app.get('/getrequirements', async (req, res) => {
    try {
      const requirements = await NewRequirment.find();
      res.json(requirements);
    } catch (err) {
      res.json({ status: "Error", msg: err.message });
    }
  });

  app.get('/getTeamrequirements/:userId', async (req, res) => {
    const { userId } = req.params; // Assuming userId is sent as a query parameter
   console.log(userId)
    try {
      // Step 1: Find the user by userId
      const user = await NewUser.findById(userId);
  
      if (!user) {
        return res.status(404).json({ status: "Error", msg: "User not found" });
      }
  
      // Step 2: Get the client's IDs associated with the user
      const clientIds = user.Clients; // Assuming Clients field contains an array of client IDs
  
      if (!clientIds || clientIds.length === 0) {
        return res.status(404).json({ status: "Error", msg: "No clients associated with this user" });
      }
  
      // Step 3: Fetch the requirements that match the client IDs
      const requirements = await NewRequirment.find({ clientId: { $in: clientIds } });
  
      // Step 4: Return the matching requirements
      res.json(requirements);
      
  
    } catch (err) {
      res.status(500).json({ status: "Error", msg: err.message });
    }
  });

  app.get('/getHomeReqData/:userId', async (req, res) => {
    const { userId } = req.params;
    console.log(userId);

    try {
        // Step 1: Find the user by userId
        const user = await NewUser.findById(userId);

        if (!user) {
            return res.status(404).json({ status: "Error", msg: "User not found" });
        }

        // Step 2: Get the client's IDs and Requirements associated with the user
        const clientIds = user.Clients; // Assuming Clients field contains an array of client IDs
        const userRequirements = user.Requirements; // Assuming Requirements field contains an array of requirement IDs

        if ((!clientIds || clientIds.length === 0) && (!userRequirements || userRequirements.length === 0)) {
            return res.status(404).json({ status: "Error", msg: "No clients or requirements associated with this user" });
        }

        // Step 3: Fetch the requirements that match the client IDs or the Requirements field in the user schema
        const requirements = await NewRequirment.find({
            $or: [
                { clientId: { $in: clientIds } },           // Match by client IDs
                { _id: { $in: userRequirements } }          // Match by requirement IDs from the user
            ]
        });

        // Step 4: Return the matching requirements
        res.json(requirements);

    } catch (err) {
        res.status(500).json({ status: "Error", msg: err.message });
    }
});


// app.get('/getrequirements', async (req, res) => {
//     try {
//       const requirements = await NewRequirment.aggregate([
//         {
//           // Join NewRequirment with NewClient based on the clientId field
//           $lookup: {
//             from: 'NewClient', // name of the NewClient collection (make sure this matches)
//             localField: 'client', // field in NewRequirment that holds the clientId
//             foreignField: '_id', // field in NewClient that holds the client _id
//             as: 'clientName' // name for the joined data
//           }
//         },
//         {
//           // Unwind the clientDetails array to merge it as an object
//           $unwind: '$clientName'
//         },
//         {
//           // Project only necessary fields (e.g., requirement details and client name)
//           $project: {
//             requirementDetails: 1, // include all the fields in NewRequirment
//             clientName: '$clientName.ClientName' // include ClientName from NewClient
//           }
//         }
//       ]);
  
//       res.json(requirements);
//       console.log(requirements)
//     } catch (err) {
//       res.json({ status: "Error", msg: err.message });
//     }
//   });
  

app.get('/getrequirements/:id', async (req, res) => {
    const Id = req.params.id;
    console.log('Fetching requirement with ID:', Id);
    
    try {
        // Fetch requirement by ID
        const requirement = await NewRequirment.findById(Id);

        // Check if the requirement exists
        if (!requirement) {
            return res.status(404).json({ status: "Error", msg: "Requirement not found" });
        }

        // Return the fetched requirement
        res.status(200).json(requirement);
    } catch (err) {
        // Handle any errors
        console.error(err.message);
        res.status(500).json({ status: "Error", msg: "Server Error" });
    }
});

app.put('/claim/:id', async (req, res) => {
    const { id } = req.params;
    const { userId, claimedDate } = req.body;
  
    if (!userId || !claimedDate) {
      return res.status(400).json({ status: "Fail", msg: "Missing required fields." });
    }
  
    try {
      // Check if the requirement exists
      const requirement = await NewRequirment.findById(id);
      if (!requirement) {
        return res.status(404).json({ status: "Fail", msg: "Requirement not found." });
      }
  
      // Add user to the claimedBy array
      const result = await NewRequirment.findByIdAndUpdate(
        id,
        {
          $addToSet: {
            claimedBy: {
              userId: userId,
              claimedDate: new Date(claimedDate),
            }
          }
        },
        { new: true }
      );
  
      if (result) {
        res.json({ status: "Success", msg: "Requirement claimed successfully." });
      } else {
        res.status(500).json({ status: "Fail", msg: "Failed to update requirement." });
      }
    } catch (err) {
      console.error('Server error:', err);
      res.status(500).json({ status: "Fail", msg: "Server error." });
    }
  });
  
  
app.get("/actions/:id/:userid", async (req, res) => {
    try {
        // Extract the requirement ID and user ID from the request parameters
        const requirementId = req.params.id;
        const userId = req.params.userid;
        
        if (!userId) {
            return res.status(401).json({ status: 'Failed', msg: 'User not authenticated' });
        }

        // Find the requirement by ID
        const requirement = await NewRequirment.findById(requirementId);
        
        if (!requirement) {
            return res.status(404).json({ status: 'Failed', msg: 'Requirement not found' });
        }

        // Check if the logged-in user has claimed this requirement
        const userClaim = requirement.claimedBy.find(claim => claim.userId === userId);

        if (!userClaim) {
            return res.status(403).json({ status: 'Failed', msg: 'You have not claimed this requirement' });
        }

        // Send the requirement data as response
        res.json(requirement);
    } catch (error) {
        console.error('Error fetching requirement:', error);
        res.status(500).json({ status: 'Failed', msg: 'Internal server error', error: error.message });
    }
});

const AssessmentSchema = new mongoose.Schema({
    assessment: {
        type: String,
        required: true
    },
    yoe: {
        type: String,
        required: true
    },
    score: {
        type: String,
        // required:true
    }
});

// Define the schema for Candidates
const CandidateSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now // Automatically set to current date
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    ctc: {
        type: String,
        required: true
    },
    ectc: {
        type: String,
        required: true
    },
    totalYoe: {
        type: String,
        required: true
    },
    relevantYoe: {
        type: String,
        required: true
    },
    lwd: {
        type: Date
    },
    currentLocation: {
        type: String,
        required: true
    },
    prefLocation: {
        type: String,
        required: true
    },
    resignationServed: {
        type: String,
        enum: ['Yes', 'No'],
        required: true
    },
    currentOrg: {
        type: String,
        required: true
    },
    candidateSkills: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    internalScreening: {
        type: String,
        enum: ['Selected', 'Rejected'],
        // required: true
    },
    sharedWithClient: {
        type: String,
        enum: ['Yes', 'No'],
        // required: true
    },
    feedback: {
        type: String
    },
    details: {
        type: String
    },
    interviewDate: {
        type: Date
    },
    educationalQualification: {
        type: String,
        required: true
    },
    offerInHand: {
        type: String
    },
    remark: {
        type: String
    },
    updatedResume: {
        type: String,// Path to the uploaded resume file
        // required:true
    },
    ornnovaProfile: {
        type: String, // Path to the uploaded Ornnova profile file
        // required:true

    },
    candidateImage: {
        type: String, // Path to the uploaded image file
        // required:true
    },
    assessments: [AssessmentSchema] ,
    uploadedOn: {
        type: Date,
        default: Date.now
    },
    recruiterId: [{
        type: String,
        required: true
    }]
});

// Define the main schema that includes reqId, recruiterId, candidates, and assessments
const MainSchema = new mongoose.Schema({
    reqId: {
        type: String,
        required: true
    },
    recruiterId: [{
        type: String,
        required: true
    }],
    candidates: [CandidateSchema],
   
});

const CandidateModel = mongoose.model('Candidate', MainSchema); // Or the correct model name

const uploadFields = upload.fields([
    { name: 'updatedResume', maxCount: 1 },
    { name: 'ornnovaProfile', maxCount: 1 },
    { name: 'candidateImage', maxCount: 1 }
]);

app.post('/Candidates', uploadFields, async (req, res) => {
    try {
        const { reqId, recruiterId, candidate } = req.body;

        // Log candidate data for debugging
        // console.log('Received candidate string:', candidate);

        // Check if candidate is provided
        if (!candidate) {
            throw new Error('Candidate data is missing or invalid');
        }

        // Parse candidate data
        let candidateData;
        try {
            candidateData = JSON.parse(candidate);
        } catch (parseError) {
            throw new Error('Failed to parse candidate data: ' + parseError.message);
        }

        // Attach file paths if they exist
        if (req.files['updatedResume']) candidateData.updatedResume = req.files['updatedResume'][0].path;
        if (req.files['ornnovaProfile']) candidateData.ornnovaProfile = req.files['ornnovaProfile'][0].path;
        if (req.files['candidateImage']) candidateData.candidateImage = req.files['candidateImage'][0].path;

        // Check if a record with the same reqId and recruiterId exists
        let existingCandidate = await CandidateModel.findOne({ reqId, recruiterId });

        if (existingCandidate) {
            // Add the new candidate to the existing candidates array
            existingCandidate.candidates.push(candidateData);
            await existingCandidate.save();
        } else {
            // Create a new document with the candidate details
            const newCandidate = new CandidateModel({ reqId, recruiterId, candidates: [candidateData] });
            await newCandidate.save();
        }

        res.status(200).json({ message: 'Candidate data saved successfully' });
    } catch (error) {
        console.error('Error saving candidate data:', error);
        res.status(500).json({ message: 'Failed to save candidate data' });
    }
});

app.get('/viewactions/:id/:userid', async (req, res) => {
    const { id, userid } = req.params;

    // Check if both id and userid are provided
    if (!id || !userid) {
        return res.status(400).json({ error: 'ID and UserID are required' });
    }

    try {
        // Find the document based on the reqId (id in this case)
        const requirement = await CandidateModel.findOne({ reqId: id, recruiterId: userid }).exec();

        // Check if the document is found and contains candidates
        if (requirement && requirement.candidates.length > 0) {
            const candidateCount = requirement.candidates.length;
            res.json({ candidateCount, candidates: requirement.candidates });
        } else {
            res.json({ message: 'No candidates found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});

app.delete('/api/candidates/:id', async (req, res) => {
    try {
        const candidateId = req.params.id;

        // Find the document that contains the candidate to be deleted
        const updatedDocument = await CandidateModel.findOneAndUpdate(
            { "candidates._id": candidateId }, // Find the document containing the candidate
            { $pull: { candidates: { _id: candidateId } } }, // Remove the candidate from the array
            { new: true } // Return the updated document
        );

        if (updatedDocument) {
            res.status(200).json({ message: 'Candidate deleted successfully' });
        } else {
            res.status(404).json({ message: 'Candidate not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting candidate', error });
        console.log(error);
    }
});

// To get Cndidates Count For a Particular Requirments
app.get('/adminviewactions/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'ID is required' });
    }

    try {
        // Find all documents with the given reqId
        const requirements = await CandidateModel.find({ reqId: id }).exec();

        if (requirements.length > 0) {
            // Aggregate all candidates across multiple documents
            const allCandidates = requirements.flatMap(req => req.candidates);
            const candidateCount = allCandidates.length;
            res.json({ candidateCount, candidates: allCandidates });
        } else {
            res.status(404).json({ message: 'No requirement found for the given ID' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch candidates', details: error });
    }
});

// To get Claimed Count
app.get('/api/requirements/:id/claimedByCount', async (req, res) => {
    try {
        const requirementId = req.params.id;
        const requirement = await NewRequirment.findById(requirementId);
             
        if (!requirement) {
            return res.status(404).json({ message: 'Requirement not found' });
        }

        const claimedByCount = requirement.claimedBy.length;

        res.status(200).json({ claimedByCount });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
        console.log(error)
    }
});

// To get Claimed users Data
app.get('/api/requirements/:id/claimedByDetails', async (req, res) => {
    try {
        const requirementId = req.params.id;
        const requirement = await NewRequirment.findById(requirementId);
        
        if (!requirement) {
            return res.status(404).json({ message: 'Requirement not found' });
        }

        // Extract user IDs from the claimedBy array
        const userIds = requirement.claimedBy.map(claim => claim.userId);

        // Find the user details for each userId
        const claimedUsers = await NewUser.find({ _id: { $in: userIds } });

        res.status(200).json({ claimedUsers });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
        console.log(error);
    }
});

// Get the number of candidates added by each recruiter for a specific reqId

app.get('/api/recruiters/:reqId', async (req, res) => {
    const { reqId } = req.params;
    if (!reqId) {
        return res.status(400).json({ error: 'reqId is required' });
    }

    try {
        const requirements = await CandidateModel.find({ reqId }).exec();

        if (requirements.length === 0) {
            return res.status(404).json({ message: 'Requirement(s) not found' });
        }

        const recruiterIdToCandidateCount = {};

        requirements.forEach(requirement => {
            requirement.candidates.forEach(candidate => {
                candidate.recruiterId.forEach(recruiterId => {
                    if (recruiterIdToCandidateCount[recruiterId]) {
                        recruiterIdToCandidateCount[recruiterId]++;
                    } else {
                        recruiterIdToCandidateCount[recruiterId] = 1;
                    }
                });
            });
        });

        const recruiterIds = Object.keys(recruiterIdToCandidateCount);

        if (recruiterIds.length === 0) {
            return res.status(404).json({ message: 'No recruiters found for these requirements' });
        }

        const recruitersDetails = await NewUser.find({ _id: { $in: recruiterIds } }).exec();

        if (recruitersDetails.length === 0) {
            return res.status(404).json({ message: 'No details found for recruiters' });
        }

        const recruitersWithCandidateCount = recruitersDetails.map(recruiter => ({
            recruiter,
            candidateCount: recruiterIdToCandidateCount[recruiter._id.toString()],
            // Add regId if it is a part of recruiter model or adjust as needed
            regId: reqId // Assuming reqId is the same as regId in your case
        }));

        res.status(200).json({ recruiters: recruitersWithCandidateCount });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
        console.error('Server Error:', error);
    }
});

// Define a route to get candidates by recruiter ID
app.get('/api/candidates', async (req, res) => {
    try {
        const { recruiterId, reqId } = req.query;
        console.log('Fetching candidates with:', { recruiterId, reqId });

        if (!recruiterId || !reqId) {
            return res.status(400).json({ message: 'Recruiter ID and Requirement ID are required' });
        }

        // Find candidates by recruiterId and reqId
        const candidatesData = await CandidateModel.find({
            recruiterId: recruiterId,
            reqId: reqId
        }).select('candidates -_id'); // Select only the candidates field and exclude _id

        // Extract only the candidates array from the result
        const candidates = candidatesData.map(doc => doc.candidates).flat();

        // Respond with the candidates data
        res.json(candidates);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get a specific candidate by ID
app.get('/candidate/:id', async (req, res) => {
    const candidateId = req.params.id;

    try {
        const mainEntry = await CandidateModel.findOne({
            'candidates._id': candidateId
        });

        if (!mainEntry) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Find the candidate within the Main document
        const candidate = mainEntry.candidates.id(candidateId);

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Send the candidate data as a response
        res.json(candidate);
    } catch (err) {
        console.error('Error fetching candidate:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update candidate details
app.put('/candidates/:id', async (req, res) => {
    const candidateId = req.params.id;
    const updateData = req.body;

    try {
        // Find the candidate in the nested structure of MainSchema
        const mainDoc = await CandidateModel.findOne({ "candidates._id": candidateId });

        if (!mainDoc) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Find the index of the candidate in the candidates array
        const candidateIndex = mainDoc.candidates.findIndex(candidate => candidate._id.toString() === candidateId);

        if (candidateIndex === -1) {
            return res.status(404).json({ message: 'Candidate not found in the array' });
        }

        // Update the candidate details
        mainDoc.candidates[candidateIndex] = { ...mainDoc.candidates[candidateIndex]._doc, ...updateData };

        // Save the updated MainSchema document
        await mainDoc.save();

        res.status(200).json(mainDoc.candidates[candidateIndex]);
    } catch (error) {
        console.error('Error updating candidate:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Assig Client to User
app.post('/assignClient/:userId/:clientId', async (req, res) => {
    const { userId,clientId} = req.params;
    // Ensure clientId is in the correct format
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ status: 'error', msg: 'Invalid Client ID format.' });
    }

    if (!clientId) {
        return res.status(400).json({ status: 'error', msg: 'Client ID is required.' });
    }

    try {
        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ status: 'error', msg: 'Invalid User ID format.' });
        }

        const user = await NewUser.findById(userId);

        if (!user) {
            return res.status(404).json({ status: 'error', msg: 'User not found.' });
        }

        // Check if clientId is already in the Clients array
        if (!user.Clients.includes(clientId)) {
            user.Clients.push(clientId);
            await user.save();
            res.json({ status: 'success', msg: 'Client assigned successfully ✅' });
        } else {
            res.json({ status: 'error', msg: 'Client already assigned to this user 😊' });
        }
    } catch (error) {
        console.error('Error assigning client:', error);
        res.status(500).json({ status: 'error', msg: 'An error occurred while assigning the client.' });
    }
});

// Get TL Home Details
app.get('/TlHome/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Find the user by ID
        const userData = await NewUser.findById(id);

        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch the client data using the IDs from the Team array
        const TeamData = await NewUser.find({
            _id: { $in: userData.Team }
        });

        // Respond with the user data and associated client data
        res.json({
            user: userData,
            Team: TeamData
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error", error: err });
    }
});

// Get Team Client Details
app.get('/TlClients/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Find the user by ID
        const userData = await NewUser.findById(id);

        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch the client data using the IDs from the Team array
        const ClientData = await NewClient.find({
            _id: { $in: userData.Clients }
        });

        // Respond with the user data and associated client data
        res.json({
            user: userData,
            Client: ClientData
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error", error: err });
    }
});

// Assign Requirement to User
app.post('/assignReq/:userId/:requirementId', async (req, res) => {
    const { userId, requirementId } = req.params;

    // Ensure requirementId is in the correct format
    if (!mongoose.Types.ObjectId.isValid(requirementId)) {
        return res.status(400).json({ status: 'error', msg: 'Invalid Requirement ID format.' });
    }

    if (!requirementId) {
        return res.status(400).json({ status: 'error', msg: 'Requirement ID is required.' });
    }

    try {
        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ status: 'error', msg: 'Invalid User ID format.' });
        }

        // Find the user by userId
        const user = await NewUser.findById(userId);

        if (!user) {
            return res.status(404).json({ status: 'error', msg: 'User not found.' });
        }

        // Check if requirementId is already in the Requirements array
        if (!user.Requirements.includes(requirementId)) {
            // Push the new requirementId into the Requirements array
            user.Requirements.push(requirementId);
            await user.save();  // Save the updated user document

            res.json({ status: 'success', msg: 'Requirement assigned successfully ✅' });
        } else {
            res.json({ status: 'error', msg: 'Requirement already assigned to this user 😊' });
        }
    } catch (error) {
        console.error('Error assigning requirement:', error);
        res.status(500).json({ status: 'error', msg: 'An error occurred while assigning the requirement.' });
    }
});

// Get Total Count of the candidates
app.get('/getTeamRequirementsCount/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Step 1: Find the user by userId
        const user = await NewUser.findById(userId);

        if (!user) {
            return res.status(404).json({ status: "Error", msg: "User not found" });
        }

        // Step 2: Get the team members' IDs associated with the user
        const teamMemberIds = user.Team;

        if (!teamMemberIds || teamMemberIds.length === 0) {
            return res.status(404).json({ status: "Error", msg: "No team members associated with this user" });
        }

        // Step 3: Fetch all requirements from MainSchema that match any team member's recruiterId
        const teamRequirements = await CandidateModel.find({
            recruiterId: { $in: teamMemberIds }
        });

        if (teamRequirements.length === 0) {
            return res.status(404).json({ status: "Error", msg: "No requirements found for team members" });
        }

        // Step 4: Initialize total candidates count, today's candidates count, and arrays to hold data
        let totalCandidatesCount = 0;
        let todaysCandidatesCount = 0;
        let totalCandidatesData = [];
        let todaysCandidatesData = [];
        let recruiterStats = []; // Array to hold stats for each recruiter

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to midnight for today's comparison

        // Step 5: Iterate through each team member (recruiter)
        for (const recruiterId of teamMemberIds) {
            let recruiterTotalCandidates = 0;
            let recruiterTodaysCandidates = 0;
            let recruiterCandidatesData = [];
            let recruiterTodaysData = [];

            // Fetch recruiter details from NewUser schema
            const recruiterDetails = await NewUser.findById(recruiterId);

            if (!recruiterDetails) {
                continue; // If recruiter not found, skip this recruiter
            }

            // Filter requirements for the current recruiter
            const recruiterRequirements = teamRequirements.filter(req => req.recruiterId.includes(recruiterId));

            // Process each requirement for the recruiter
            recruiterRequirements.forEach(req => {
                req.candidates.forEach(candidate => {
                    recruiterTotalCandidates++; // Increment recruiter's total candidates count
                    totalCandidatesCount++; // Increment total for all recruiters
                    recruiterCandidatesData.push(candidate); // Collect recruiter's candidate data
                    totalCandidatesData.push(candidate); // Collect all candidate data

                    // Check if candidate was uploaded today
                    const uploadedOn = new Date(candidate.uploadedOn);
                    if (uploadedOn >= today) {
                        recruiterTodaysCandidates++; // Increment recruiter's today's candidates count
                        todaysCandidatesCount++; // Increment today's total count
                        recruiterTodaysData.push(candidate); // Collect recruiter's today's data
                        todaysCandidatesData.push(candidate); // Collect today's total data
                    }
                });
            });

            // Add this recruiter's stats to the recruiterStats array
            recruiterStats.push({
                recruiterId: recruiterDetails._id,
                recruiterCode:recruiterDetails.EmpCode,
                recruiterName: recruiterDetails.EmployeeName, // Add recruiter name
                recruiterEmail: recruiterDetails.Email,       // Add recruiter email
                totalCandidates: recruiterTotalCandidates,
                todaysCandidates: recruiterTodaysCandidates,
                totalCandidatesData: recruiterCandidatesData,  // Candidate data for this recruiter
                todaysCandidatesData: recruiterTodaysData      // Today's candidate data for this recruiter
            });
        }

        // Step 6: Send the response with total, today's counts, candidate data, and recruiter stats
        res.json({
            status: "Success",
            totalCandidates: totalCandidatesCount,
            todaysCandidates: todaysCandidatesCount,
            totalCandidatesData,       // Array of all candidates
            todaysCandidatesData,      // Array of today's candidates
            recruiterStats             // Array with stats for each recruiter, including their details
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Error", msg: err.message });
    }
});














  














  


  






