import { makeId } from "./utils.js";
import fs from 'fs';

const PROPERTIES_FILE = './data/property.json'
const USERS_FILE = './data/user.json'
const ORDERS_FILE = './data/order.json'

const users = [
    {...getEmptyUser('Alice Johnson','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'alicej',[]), _id:makeId()},
    {...getEmptyUser('Bob Smith','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'bobsmith',[]), _id:makeId()},
    {...getEmptyUser('Charlie Brown','https://static.wixstatic.com/media/449abe_5bcdc480851443d6b592c87fa3552f4e~mv2.jpg/v1/fill/w_744,h_744,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/cb-color.jpg', 'charlieb',[]), _id:makeId()},
    {...getEmptyUser('Diana Prince','https://static.wikia.nocookie.net/marvel_dc/images/c/cc/Wonder_Woman_Vol_5_4_Textless.jpg/revision/latest?cb=20160810132845', 'dianap',[]), _id:makeId()},
    {...getEmptyUser('Ethan Hunt','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'ethanh',[]), _id:makeId()},
    {...getEmptyUser('Fiona Gallagher','https://decider.com/wp-content/uploads/2019/03/shameless-season-9-finale-emmy-rossum.jpg?quality=75&strip=all&w=978&h=652&crop=1', 'fionag',[]), _id:makeId()},
    {...getEmptyUser('George Martin','https://cdn.pixabay.com/photo/2014/04/03/10/32/businessman-310819_1280.png', 'georgem',[]), _id:makeId()},
    {...getEmptyUser('Hannah Lee','https://cdn.pixabay.com/photo/2016/03/31/19/56/avatar-1295397_1280.png', 'hannahl',[]), _id:makeId()},
    {...getEmptyUser('Ian Somerhalder','https://img.freepik.com/free-vector/woman-with-long-brown-hair-pink-shirt_90220-2940.jpg?semt=ais_hybrid&w=740&q=80', 'ians',[]), _id:makeId()},
    {...getEmptyUser('Julia Roberts','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'juliar',[]), _id:makeId()},
    {...getEmptyUser('Kevin Spacey','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'kevins',[]), _id:makeId()},
    {...getEmptyUser('Laura Palmer','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'laurap',[]), _id:makeId()},
    {...getEmptyUser('Michael Scott','https://newprofilepic.photo-cdn.net//assets/images/article/profile.jpg?90af0c8', 'michaels',[]), _id:makeId()},
    {...getEmptyUser('Nina Dobrev','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'ninad',[]), _id:makeId()},
    {...getEmptyUser('Oscar Isaac','https://bst.icons8.com/wp-content/uploads/2024/05/parakeet_female_profile_icon.webp', 'oscari',[]), _id:makeId()},
    {...getEmptyUser('Pam Beesly','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'pamb',[]), _id:makeId()},
    {...getEmptyUser('Quentin Tarantino','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'quentint',[]), _id:makeId()},
    {...getEmptyUser('Rachel Green','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'rachelg',[]), _id:makeId()},
    {...getEmptyUser('Steve Rogers','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'stever',[]), _id:makeId()},
    {...getEmptyUser('Tina Fey','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'tinaf',[]), _id:makeId()},
    {...getEmptyUser('Uma Thurman','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'umat',[]), _id:makeId()},
    {...getEmptyUser('Victor Stone','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'victors',[]), _id:makeId()},
    {...getEmptyUser('Wendy Darling','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'wendyd',[]), _id:makeId()},
    {...getEmptyUser('Xander Cage','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'xanderc',[]), _id:makeId()},
    {...getEmptyUser('Yara Shahidi','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'yaras',[]), _id:makeId()},
    {...getEmptyUser('Zoe Saldana','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'zoes',[]), _id:makeId()},
    {...getEmptyUser('Aaron Paul','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'aaronp',[]), _id:makeId()},
    {...getEmptyUser('Betty Cooper','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'bettyc',[]), _id:makeId()},
    {...getEmptyUser('Carl Grimes','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'carlg',[]), _id:makeId()},
    {...getEmptyUser('Donna Paulsen','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'donnap',[]), _id:makeId()},
    {...getEmptyUser('Elliot Alderson','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'elliota',[]), _id:makeId()},
    {...getEmptyUser('Felicity Smoak','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'felicitys',[]), _id:makeId()},
    {...getEmptyUser('Gordon Freeman','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'gordonf',[]), _id:makeId()},
    {...getEmptyUser('Harley Quinn','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'harleyq',[]), _id:makeId()},
    {...getEmptyUser('Isaac Clarke','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'isaacc',[]), _id:makeId()},
    {...getEmptyUser('Jesse Pinkman','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'jessep',[]), _id:makeId()},
    {...getEmptyUser('Kara Danvers','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'karad',[]), _id:makeId()},
    {...getEmptyUser('Leonard Hofstadter','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'leonardh',[]), _id:makeId()},
    {...getEmptyUser('Monica Geller','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'monicag',[]), _id:makeId()},
    {...getEmptyUser('Nathan Drake','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'nathand',[]), _id:makeId()},
    {...getEmptyUser('Olivia Pope','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'oliviap',[]), _id:makeId()},
    {...getEmptyUser('Peter Parker','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'peterp',[]), _id:makeId()},
    {...getEmptyUser('Quinn Fabray','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'quinnf',[]), _id:makeId()},
    {...getEmptyUser('Rick Grimes','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'rickg',[]), _id:makeId()},
    {...getEmptyUser('Samantha Carter','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'samanthac',[]), _id:makeId()},
    {...getEmptyUser('Tommy Shelby','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'tommys',[]), _id:makeId()},
    {...getEmptyUser('Ursula Buffay','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'ursulab',[]), _id:makeId()},
    {...getEmptyUser('Vince Gilligan','https://cdn.pixabay.com/photo/2017/01/31/21/23/avatar-2027366_1280.png', 'vinceg',[]), _id:makeId()},
    {...getEmptyUser('Wanda Maximoff','https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png', 'wandam',[]), _id:makeId()},
    {...getEmptyUser('Xena Warrior','https://cdn.pixabay.com/photo/2016/04/15/18/05/computer-1331579_1280.png', 'xenaw',[]), _id:makeId()},
]

const demoPropertiesPictures = [
    'https://st.hzcdn.com/simgs/97910d6b0407c3d1_14-0485/_.jpg',
    'https://www.marthastewart.com/thmb/lxfu2-95SWCS0jwciHs1mkbsGUM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/modern-living-rooms-wb-1-bc45b0dc70e541f0ba40364ae6bd8421.jpg',
    'https://www.marthastewart.com/thmb/JSJwSMsolMumuoCAHHIjICbzYgs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/BradRamseyInteriors_credit_CarolineSharpnack-dee35c1fab554898af7c549697c2f592.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOUTnj8To32CSO4Ea4_ZhHkz4JSHOaqGORPg&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGmkx2Umg4LvSkn2y12K_ClQgk6W_F02SzhA&s',
    'https://cdn.mos.cms.futurecdn.net/rmUuWniHKpPEUMi6n7P8Ra.jpg',
    'https://cdn.apartmenttherapy.info/image/upload/f_jpg,q_auto:eco,c_fill,g_auto,w_1500,ar_4:3/at%2Fstyle%2F2023-09%2Fliving-room-decor-ideas%2Fpattern-play',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLL24UVBb5PlHH3IfwtNIxXrqXl9hH_DHgRg&s',
    'https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_2560,h_1598/https://www.essentialhome.eu/inspirations/wp-content/uploads/2024/11/32-Elegant-Living-Rooms-That-Showcase-the-Art-of-Luxury_21-min-scaled.jpg',
    'https://cdn.mos.cms.futurecdn.net/FjF4p3nsgJPamTvvYRna84.jpg',
    'https://media.designcafe.com/wp-content/uploads/2020/03/21012613/luxury-living-room-designs.jpg',
    'https://cdn.mos.cms.futurecdn.net/H73mVvQQs96oPvDTPPWTTY.jpg',
    'https://cdn.decorilla.com/online-decorating/wp-content/uploads/2023/10/Living-room-decor-trends-2024.jpg?width=900',
    'https://i.ytimg.com/vi/WpT-Lp_HaH4/maxresdefault.jpg',
    'https://i.ytimg.com/vi/RfYc0BUqkMs/maxresdefault.jpg',
    'https://hips.hearstapps.com/hmg-prod/images/apartment-living-room-design-ideas-hbx040122nextwave-013-1656022467.jpg?crop=1.00xw:0.747xh;0,0.200xh&resize=1200:*',
    'https://www.thespruce.com/thmb/8O_XGPj2llBN0TGCXtFz5GUrytM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/rsw984h656-d6d00a18536d4afc8b48c0da03702ea7.jpeg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWo0aS9TAekC52w9HOswNpPX1tWd-Oo0z4Ew&s',
    'https://www.familyhandyman.com/wp-content/uploads/2023/02/neutral-design-small-apartment-via-instagram-e1677523038814.jpg?fit=700%2C700',
    'https://media.designcafe.com/wp-content/uploads/2020/02/21010329/modern-living-room-design-ideas.jpg',
    'https://www.thespruce.com/thmb/-QgLBTD5X5b-VmmUPyTyZUS99r0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/9H4A5504copy-4e4e05eda0e74a50a2846d3ac5d9127c.jpg',
    'https://www.luxurychicagoapartments.com/wp-content/uploads/2023/03/Seven-10-West-2-Bedroom-06.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvCRg9I-ka9v9ZeE9wAxApn7YC2SY7XK8nAg&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfrZSUKXq694ka-j6dGqnkvRmplC_jpuxVLw&s',
    'https://stylebyemilyhenderson.com/wp-content/uploads/2020/10/IMG_6041-3.jpg',
    'https://cdn.decoist.com/wp-content/uploads/2020/04/Separate-bedroom-in-the-one-bedroom-apartment-gives-you-ample-privacy-84410.jpg',
    'https://d28pk2nlhhgcne.cloudfront.net/assets/app/uploads/sites/3/2023/03/2-bedroom-apartment-floor-plans-1-1-1.png',
    'https://cdn.apartmenttherapy.info/image/upload/v1725034090/at/house%20tours/2024/august/emmy-p/tours-losangeles-emmy-p-02.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZp_u152bOPvJUhl8NLlalfpGSNDxngp5SoA&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaAvDwM6MCgs_rm6b0GAxfXtrQN7Eo9tMJGQ&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmXeWRUy5n8bXxlUfvxESGOMm2NqlDq-ahbw&s',
    'https://livingsuites.com/wp-content/uploads/2020/06/1.-Three-Bedroom-Apartment-door-connecting-1.jpg',
    'https://cdn.apartmenttherapy.info/image/upload/v1691674550/at/house%20tours/2023-House-Tours/2023-August/jhenene-l/tours-nyc-jhenene-l-03.jpg',
    'https://cf.bstatic.com/xdata/images/hotel/max1024x768/363133922.jpg?k=5057b2e4a16c00914d884d3c71d3302a9fe75c77c7e7d04b232671efba1a2229&o=&hp=1',
    'https://www.redfin.com/blog/wp-content/uploads/2022/10/item_3-2.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLgZqjl8Vy-ZgnPE-tmeyfQRzgagexIMJ4fQ&s',
    'https://2024-rd-staging.nyc3.cdn.digitaloceanspaces.com/2024-prepare-for-canada/2024/11/16162323/Why-a-2-bedroom-apartment-Featured-Image.png',
    'https://tlv2go.com/wp-content/uploads/2020/10/%D7%97%D7%93%D7%A8-%D7%A9%D7%99%D7%A0%D7%94-e1618399252707.jpg',
    'https://lh7-rt.googleusercontent.com/docsz/AD_4nXf4-uB-n3bdTT9beBkzWqPxBtdnhauSPeibtDWMt8sTn-XhtO6ZRydComDg6MJnN_DT3kh84VJOb2yGNWJXPi26m5k41wIypXZ4si4-eZar3g5Jr6lf7pQztqgHwr_T60CYveulTEIiZmzFqqtrHcPZR4kP?key=SFAp1cLSLLhyyupiKp5-Cg',
    'https://cdn.decoist.com/wp-content/uploads/2020/04/Classic-Studio-Apartment-in-Manhattan-where-the-bedroom-becomes-a-part-of-the-living-space-95615.jpg',
    'https://hips.hearstapps.com/hmg-prod/images/1737-q54a-jm-0403-lowres-designer-jennifer-mcgee-67dc655a1d1ac.jpg',
    'https://thelondonbathco.co.uk/wp-content/uploads/2021/07/iStock-1285717693-1920x1280.jpg',
    'https://getcanopy.co/cdn/shop/articles/pexels-christa-grover-977018-1910472_a6eacbcd-2d05-4163-aea7-af448d9d7a95.jpg?v=1732249806',
    'https://i.pinimg.com/736x/0d/8d/45/0d8d451ef2f2eecf040b38049febdf27.jpg',
    'https://bendmagazine.com/wp-content/uploads/2022/04/light-turquoise-spa-like-bathroom-Analicia-Herrmann.jpg',
    'https://cdn.mos.cms.futurecdn.net/jTf2tgYVw54nc4PEvjBVtT.jpg',
    'https://www.freestandingbath.co.uk/wp-content/uploads/2025/02/luxury-bathroom-featured.jpg',
    'https://imgix.cosentino.com/en-ie/wp-content/uploads/2025/02/Cosentino_Booth_KBIS_2025_15.jpg?auto=format%2Ccompress&ixlib=php-3.3.0',
    'https://bathtrendsusa.com/cdn/shop/files/24.jpg?v=1721336556&width=2800',
    'https://www.bellabathrooms.co.uk/blog/wp-content/uploads/2020/09/iStock-1158066696-1.jpg',
    'https://www.bellabathrooms.co.uk/blog/wp-content/uploads/2020/09/iStock-1158066696-1.jpg',
    'https://adamsez.com/wp-content/uploads/2024/10/home_2.jpg',
    'https://images.unsplash.com/photo-1696987007764-7f8b85dd3033?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bHV4dXJ5JTIwYmF0aHJvb218ZW58MHx8MHx8fDA%3D&fm=jpg&q=60&w=3000',
    'https://duravitprod-media.e-spirit.cloud/75e15e67-f417-4084-8696-5e4151ad35b8/images/Planung-Inspiration/Magazin/6-Schritte-zum-Traumbad/whitetulip_culture_01_2_1.jpg',
    'https://www.thespruce.com/thmb/J53yaSLGsDzkOOTYiXuP52oMJ8I=/2048x0/filters:no_upscale():max_bytes(150000):strip_icc()/modern-bathroom-design-ideas-4129371-hero-723611e159bb4a518fc4253b9175eba8.jpg',
    'https://img.freepik.com/free-photo/modern-bathroom-with-bathtub-double-sink-vanity-smart-home-technology_9975-33078.jpg?semt=ais_hybrid&w=740&q=80',
    'https://ahouseinthehills.com/wp-content/uploads/2023/11/Efficiency-Meets-Style-Modern-Bathroom-Products-for-Contemporary-Homes-scaled.jpeg',
    'https://showroom.coburns.com/wp-content/uploads/2022/01/sidekix-media-g51F6-WYzyU-unsplash.jpg',
    'https://img.staticmb.com/mbcontent/images/crop/uploads/2022/11/Balcony-decor-lights_0_1200.jpg.webp',
    'https://res.cloudinary.com/dw4e01qx8/f_auto,q_auto/images/m8jt2phsv9gjety3w1ub',
    'https://media.designcafe.com/wp-content/uploads/2020/08/29114351/options-for-seating-in-balcony-interior-design.jpg',
    'https://media.admiddleeast.com/photos/6682dcd29964267a3a5503f7/master/w_1600%2Cc_limit/By%2520Michael%2520Stavaridis.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcz8c7qM15x4nMub-Ehlc40-QB1XKAWpe09Q&s',
    'https://media.designcafe.com/wp-content/uploads/2020/02/21004553/balcony-furniture-ideas.jpg',
    'https://thearchitectsdiary.com/wp-content/uploads/2024/04/Types-of-balcony-9-1024x667.webp',
    'https://cdn.aarp.net/content/dam/aarp/home-and-family/your-home/2021/02/1140-woman-balcony.jpg',
    'https://assets.architecturaldigest.in/photos/62e1222e9e358822d96a421b/master/pass/5%20balcony%20design%20ideas%20to%20create%20a%20cozy%20outdoor%20space%20during%20the%20monsoon.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKXmS87gQXYZkoiqDZlIhUhKYMwTbl5zUtzA&s',
    'https://my-geranium.com/wp-content/uploads/sites/2/2025/03/2025-Geranien-5000-Frohliches-Leben-im-Freien-06.jpg',
    'https://contemporarystructures.co.uk/wp-content/uploads/2023/11/lumon-balcony-glazing-roof-1280x914-1.webp',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaGEcoKYhNbENZ6Vk4iL-G_Y_MrGM9wXRxpA&s',
    'https://cdn.mos.cms.futurecdn.net/SBEc9byj6fg7aaGVfiKuqf.jpg',
    'https://foyr.com/learn/wp-content/uploads/2019/03/balcony-design-ideas-scaled-1200x675.jpg',
    'https://cdn.mos.cms.futurecdn.net/bJauktLkEuUrjXXKNUaPAh.jpg',
    'https://blog.displate.com/wp-content/uploads/2022/09/Balcony-Ideas_23.jpg',
    'https://www.thespruce.com/thmb/pxHUZL7HME0HMU2h0l57g8OFGHk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/JessBungeforEHDtinybalcony-58af2c107b074437bd0bf0993fb43187.jpeg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyncK8nofaQGyKEFPKqd-SSpoUyeyOjTY2XA&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYgbAhD_fGrR7jA1pEXjYyQAZh5x_qC07qgg&s',
    'https://api.photon.aremedia.net.au/wp-content/uploads/sites/2/2018/01/small-balcony-ideas.jpg?fit=1920%2C1080',
    'https://media.designcafe.com/wp-content/uploads/2023/07/05145205/balcony-storage-solutions.jpg'
]

const nameParts=['Sunset','Pines', 'Rout 9', 'Pinecrest', 'Highway', "Traveler's", "Evergreen", 'Stop',
                 'Desert', 'Palms', 'Stopover', 'Coastline', 'Moonlight', 'Crossroads', 'Road', 'Blubird',
                 'Orchard', 'Trail', 'Valley', 'View', 'Lakeside', 'Golden', 'Harbor', 'Starlit', 'House',
                 'Summit', 'Inn', 'Park', 'North', 'West', 'East', 'South', 'Ember', 'Lodge', 'Grove']

const amenities=['TV', 'Wifi', 'Kitchen', 'Smoking allowed', 'Pets allowed', 'Cooking basics', 'A/C', 'Pool', 'Hot tub',
                 'Free Parking', 'Washer', 'Dryer', 'Heating', 'Workspace', 'Hairdryer','Iron', 'EV charger', 'Crib', 
                 'King bed','Breakfast','Gym', 'Grill', 'Indoor fireplace', 'Beachfront', 'Waterfront', 'Smoke alarm', 'Carbon monoxide alarm',
                 'Self check-in','free cancellation',]

const propertyType=['House', 'Apartment', 'Guesthouse', 'Hotel']

const accessibility=['Step-free access', 'Disabled parking', 'Wide entrance', 'Step-free bedroom', 'Wide bedroom enterance',
                     'Step-free bathroom', 'Wide bathroom enterance', 'Toilet grab bar', 'Shower grab bar', 'Step-free shower',
                     'bath chair', 'Ceilling or mobile host']

const reviews=['Very helpful hosts. Cooked traditional meals for us and gave great tips about the area.',
               'Amazing location and stunning views! The apartment was clean and well-equipped.',
               'Had a wonderful stay! The host was very accommodating and the place felt like home.',
               'Beautiful property with great amenities. Would definitely recommend to others!',
               'The house was spacious and comfortable. Perfect for our family vacation.',
               'Fantastic experience from start to finish. The host went above and beyond to ensure we had a great stay.',
               'Lovely decor and a cozy atmosphere. The balcony had the best views of the city.',
               'Great value for the price. The location was convenient and the neighborhood was safe.',
               'The kitchen had everything we needed to cook our own meals. Made our stay even better!',
               'Highly recommend this place! The host was responsive and provided excellent recommendations for local attractions.',
               "Room was dirty on arrival — stained sheets and a mildew smell in the bathroom. Staff took forever to respond.",
               "Photos are misleading. The place is tiny, the bed is lumpy, and the HVAC rattled all night.",
               "Check-in was a mess and the host was rude. Hidden cleaning fees added at checkout.",
               "Host cancelled our stay last minute and offered a refund — left us scrambling for alternatives.",
               "Good location but poor upkeep: broken shower head, flickering lights, and a loose door latch.",
               "Overpriced for what you get. Minimal supplies, no toiletries, and the Wi-Fi didn't work.",
               "Thin walls — neighbors were loud until the early morning and management never intervened.",
               "Safety concerns: exterior lighting was out and the deadbolt was loose. I didn't feel secure."
]

const citys=[{ countryCode: 'US', city: 'New York', minLat: 40.4774, maxLat: 40.9176, minLng: -74.2591, maxLng: -73.7004 },
             { countryCode: 'FR', city: 'Paris', minLat: 48.8156, maxLat: 48.9022, minLng: 2.2241, maxLng: 2.4699 },
             { countryCode: 'JP', city: 'Tokyo', minLat: 35.5285, maxLat: 35.8395, minLng: 139.6100, maxLng: 139.9100 },
             { countryCode: 'AU', city: 'Sydney', minLat: -34.1183, maxLat: -33.5781, minLng: 150.5209, maxLng: 151.3430 },
             { countryCode: 'BR', city: 'Rio de Janeiro', minLat: -23.0827, maxLat: -22.7468, minLng: -43.7955, maxLng: -43.0900 },
             { countryCode: 'ZA', city: 'Cape Town', minLat: -34.2580, maxLat: -33.7900, minLng: 18.3554, maxLng: 18.7034 },
             { countryCode: 'IT', city: 'Rome', minLat: 41.7690, maxLat: 42.0092, minLng: 12.3959, maxLng: 12.8555 },
             { countryCode: 'CA', city: 'Toronto', minLat: 43.5810, maxLat: 43.8555, minLng: -79.6393, maxLng: -79.1152 },
             { countryCode: 'IN', city: 'Mumbai', minLat: 18.8920, maxLat: 19.2710, minLng: 72.7754, maxLng: 72.9860 },
             { countryCode: 'GB', city: 'London', minLat: 51.2868, maxLat: 51.6919, minLng: -0.5103, maxLng: 0.3340 },
             { countryCode: 'DE', city: 'Berlin', minLat: 52.3383, maxLat: 52.6755, minLng: 13.0884, maxLng: 13.7611 },
             { countryCode: 'ES', city: 'Barcelona', minLat: 41.3200, maxLat: 41.4690, minLng: 2.0520, maxLng: 2.2280 },
             { countryCode: 'NL', city: 'Amsterdam', minLat: 52.3396, maxLat: 52.5000, minLng: 4.8342, maxLng: 5.1000 },
             { countryCode: 'MX', city: 'Mexico City', minLat: 19.2041, maxLat: 19.5926, minLng: -99.3633, maxLng: -99.0421 },
             { countryCode: 'RU', city: 'Moscow', minLat: 55.4500, maxLat: 55.9500, minLng: 37.3000, maxLng: 37.8000 },
             { countryCode: 'KR', city: 'Seoul', minLat: 37.4133, maxLat: 37.7151, minLng: 126.7341, maxLng: 127.1022 },
             { countryCode: 'ISR', city: 'Tel Aviv', minLat: 32.0150, maxLat: 32.1500, minLng: 34.7500, maxLng: 34.9000 },
             { countryCode: 'TR', city: 'Istanbul', minLat: 40.8500, maxLat: 41.2000, minLng: 28.7000, maxLng: 29.3000 },
             { countryCode: 'SE', city: 'Stockholm', minLat: 59.2000, maxLat: 59.4500, minLng: 17.8000, maxLng: 18.2000 },
             { countryCode: 'CH', city: 'Zurich', minLat: 47.3200, maxLat: 47.4500, minLng: 8.4500, maxLng: 8.6500 }
            ]

function getSublist(list, size){
    const arr=[]
    for(let i=0;i<size;i++){
        const idx = Math.floor(Math.random()*list.length)
        arr.push(list[idx])
    }

    return arr
}

export function getPictures(num=5){
    return getSublist(demoPropertiesPictures, num)
}

function getName(){
    const arr=getSublist(nameParts, 2)
    return `${arr[0]} ${arr[1]}`
}

function getAmenities(num=8){
    return getSublist(amenities, num)
}

function getAccessibility(num=3){
    return getSublist(accessibility, num)
}

function getPropertyType(){
    const idx = Math.floor(Math.random()*propertyType.length)
    return propertyType[idx]
}

function getHost(){
    const idx = Math.floor(Math.random()*users.length)
    return users[idx]._id
}

function getLoc(loc){
    const lat = Math.random() * (loc.maxLat - loc.minLat) + loc.minLat
    const lng = Math.random() * (loc.maxLng - loc.minLng) + loc.minLng
    return { country: loc.country || 'Country', countryCode: loc.countryCode || 'CC', city: loc.city || 'City', address: `${Math.floor(Math.random()*100)} Random St`, lat,  lng}
}

function getReview(){
    return {
			id: makeId(),
			txt: reviews[Math.floor(Math.random()*reviews.length)],
			rate: Math.floor(Math.random()*5+1),
			by: getHost(),
		}
}

function getReviews(num=10){
    const arr = []
    for(let i=0;i<num;i++){
        arr.push(getReview())
    }
    return arr
}

export function getDemoProperty(loc = { countryCode: '', city: '', maxLat: 90, minLat: -90, maxLng: 180, minLng: -180}){
    return { ...getEmptyProperty(
        getName(),
        getPropertyType(),
        getPictures(),
        parseFloat((Math.random()*300+50).toFixed(1)), //price
        'Fantastic duplex apartment...',
        {adults: Math.floor(Math.random()*5+1), children: Math.floor(Math.random()*4), infants: Math.floor(Math.random()*2),pets: Math.floor(Math.random()*2)},
        getAmenities(),
        getAccessibility(),
        Math.floor(Math.random()*3+1), //bathrooms
        Math.floor(Math.random()*6+1), //beds
        Math.floor(Math.random()*5+1), //bedrooms
        [], //rules
        [], //labels
        getHost(),
        getLoc(loc),
        getReviews(Math.floor(Math.random()*12+3))
    ), _id: makeId()}
}

function generateDemoData(){
    const demoProperties=[]
    for(let i=0;i<citys.length;i++){
        for(let j=0;j<40;j++){
            const loc = citys[i]
            demoProperties.push(getDemoProperty(loc))
        }
    }
    const demoUesers=[...users]
    for (let i=0;i<demoProperties.length;i++){
        const prop=demoProperties[i]
        const hostIdx=demoUesers.findIndex(user=>user._id===prop.host)
        if(hostIdx!==-1){
            demoUesers[hostIdx].properties.push(demoProperties[i]._id)
        }
    }
    return [demoProperties, demoUesers, []]
}

function setDemoData() {
    const [demoProperties, demoUsers, demoOrders] = generateDemoData()
    writeJsonFile(PROPERTIES_FILE, demoProperties)
    writeJsonFile(USERS_FILE, demoUsers)
    writeJsonFile(ORDERS_FILE, demoOrders)
}

function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8')
}


function getEmptyProperty( name = '', 
                           type= null,
                           imgUrls= [], 
                           price = 0, 
                           summary= '', 
                           capacity= {adults:1,kids:0,infants:0,pets:0},
                           amenities= [],
                           accessibility= [],
                           bathrooms= 1,
                           bedrooms= 1,
                           beds= 1,
                           rules= [],
                           labels= [],
                           host= undefined,
                           loc= {country: null, countryCode: null, city: null, address: null, lat: 0, lng: 0},
                           reviews= []) {
    return { name,
             type,
             imgUrls,
             price,
             summary,
             capacity,
             amenities,
             accessibility,
             bathrooms,
             bedrooms,
             beds,
             rules,
             labels,
             host,
             loc,
             reviews
         }
}

export function getEmptyUser(fullname = '', imgUrl = '', username = '', properties = []) {
    return { fullname, imgUrl, username, properties }
}

export function isFileExists(path) {
    return fs.existsSync(path)
} 

export function validateDATA() {
    console.log('Validating demo data...')
    if (!isFileExists(PROPERTIES_FILE) || !isFileExists(USERS_FILE) || !isFileExists(ORDERS_FILE)) {
        console.log('Demo data not found, generating...')
        setDemoData()
        console.log('Demo data generated.')
    }
    console.log('Demo data validation complete.')
}

