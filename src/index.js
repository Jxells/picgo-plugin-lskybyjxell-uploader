module.exports = (ctx) => {
	const register = () => {
		ctx.helper.uploader.register('lsky-uploader', {
			handle,
			config: config,
			name: 'lsky'
		})
		ctx.on('remove', (files, guiApi) => {
			ctx.log.info(files)
			del(ctx, files)
		})
	}


	return {
		uploader: 'lsky-uploader',
		register,
		
	}
}


const handle = async (ctx) => {
	let userConfig = ctx.getConfig('picBed.lsky-uploader')
	if (!userConfig) {
		throw new Error('Can\'t find uploader config')
	}
	const Url = userConfig.Url
	const Token = userConfig.Token

	const imgList = ctx.output
	for (let i in imgList) {
		let image = imgList[i].buffer
		if (!image && imgList[i].base64Image) {
			image = Buffer.from(imgList[i].base64Image, 'base64')
		}
		const postConfig = postOptions(Url, Token, imgList[i].fileName, image)
		let body = await ctx.request(postConfig)
		body = JSON.parse(body)
		ctx.log.info('上传图片的返回值是：', body);
		if (body.status) {
			delete imgList[i].base64Image
			delete imgList[i].buffer
			imgList[i].imgUrl = body.data.links.url
			imgList[i].id = body.data.key
			ctx.log.info('上传成功ggg');

			ctx.emit('notification', {
				title: '上传成功',
				body: "图片上传成功"
			})

		} else {
			ctx.emit('notification', {
				title: '上传失败',
				body: body.message
			})
			throw new Error(body.message)
		}
	}
	return ctx
}
const del = async (ctx,files) => {
	let userConfig = ctx.getConfig('picBed.lsky-uploader')
	if (!userConfig) {
		throw new Error('Can\'t find uploader config')
	}
	const Url = userConfig.Url
	const Token = userConfig.Token
	const imgList = files
	for (let i=0;i<imgList.length;i++){
		let imgid = imgList[i].id
		ctx.log.info('这里的imgid是：', imgid);
		let deleteConfig = GenDeleteParam(Url, Token,imgid)
		let body = await ctx.request(deleteConfig)
		body = JSON.parse(body)
		ctx.log.info('删除图片的返回值是：', body);
		ctx.log.info(body);
	}
	return ctx
}

const postOptions = (Url, Token, fileName, image) => {
	return {
		method: 'POST',
		url: Url + `/api/v1/upload`,
		headers: {
			contentType: 'multipart/form-data',
			'Accept': 'application/json',
			'Authorization': `Bearer ` + Token,
			'User-Agent': 'PicGo'
		},
		formData: {
			file: {
				value: image,
				options: {
					filename: fileName
				}
			},
			ssl: 'true'
		}
	}
}
//  删除图片
const GenDeleteParam = (Url, Token,imgid) => {
	const currentImageKey = imgid
	return {
		method: 'DELETE',
		url: Url + `/api/v1/images/` + currentImageKey,
		headers: {
			contentType: 'multipart/form-data',
			'Accept': 'application/json',
			'Authorization': `Bearer ` + Token,
			'User-Agent': 'PicGo'
		},
		formData: {
			ssl: 'true'
		}
	}


}

const config = ctx => {
	let userConfig = ctx.getConfig('picBed.lsky-uploader')
	if (!userConfig) {
		userConfig = {}
	}
	return [{
		name: 'Url',
		type: 'input',
		default: userConfig.Url,
		required: true,
		message: '服务器域名',
		alias: '服务器域名'
	},
	{
		name: 'Token',
		type: 'input',
		default: userConfig.Token,
		required: true,
		message: '获取的Token',
		alias: '获取的Token'
	},
	]
}
