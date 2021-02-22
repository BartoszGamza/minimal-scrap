const express = require('express')
const request = require('request')
const cheerio = require('cheerio')
const download = require('node-image-downloader')

const scrapImages = (url) => {
    request(url, (err, res, html) => {
        const $ = cheerio.load(html)

        const header = $('#Header1_headerimg').attr('src')

        console.log('header link', header)

        download({
            imgs: [{
                uri: header,
                name: 'logo'
            }],
            dest: './downloads'
        }).then(() => console.log('done')).catch(err => console.log(err))
    })


}

const app = express()

app.get('/', (req, res) => {
    const url = 'http://www.minimalb.art/'

    scrapImages(url)
})

app.listen(5000)

