const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const download = require('node-image-downloader')

function extractLinks ($, objects, requireBlogPage = false) {
    const targetArray = []
    objects.each((_, element) => {
        const href = $(element).attr('href')
        if (href && href.includes('minimalb.art')) {
            if (requireBlogPage) {
                if (href.endsWith('.html')) {
                    targetArray.push(href)
                }
            } else {
                targetArray.push(href)
            }
        }
    })
    return targetArray
}

async function getLinksBySelector (url, selector, blogPages = false) {
    return axios.get(url).then(({data}) => {
        const $ = cheerio.load(data)
        const expandableObjects = $(selector)
        return extractLinks($, expandableObjects, blogPages)
    }) 
}

async function parseBlogPost (url) {
    return axios.get(url).then(({data}) => {
        const $ = cheerio.load(data)
        const getPostDate = () => {
            const date = new Date($('.published').attr('title'))
            return [date.getFullYear(), date.getMonth(), date.getDate()].join('-')
        } 
        const post = {
            title: $('.post-title').text().replace(/(\r\n|\n|\r)/gm, ''),
            date: getPostDate(),
            images: []
        }
        $('.post-body').find('img').each((_, el) => {
            post.images.push($(el).attr('src'))
        })
        return post
    })
}

function getPath (date, title) {
    return  `./downloads/${date}-${title.split(' ').map(word => word.toLowerCase()).join('-')}`
}

async function createDirectory (date, title) {
    return fs.mkdir(getPath(date, title), { recursive: true }, ( err ) => {
        if (err) {
            console.log(err)
        }
    })
}

async function downloadImages (imageLinks, dest) {
    download({
        imgs: imageLinks.map((link, index) => ({
            uri: link,
            name: index
        })),
        dest,
    }).then(() => console.log(dest, 'downloaded')).catch(err => console.log(dest, err))
}

const url = 'http://www.minimalb.art/'
const collapisbleObjectSelector = '.post-count-link'
const linkSelector = 'a'

getLinksBySelector(url, collapisbleObjectSelector).then(historicalLinks => {
    Promise.all(historicalLinks.map(async link => {
        return getLinksBySelector(link, linkSelector, true)
    })).then(allPostLinks => {
        const flattened = [].concat.apply([], allPostLinks)
        const uniq = [...new Set(flattened)]
        console.log('posts acquired')
        Promise.all(uniq.map(async post => parseBlogPost(post))).then(posts => {
            console.log('posts parsed')
            Promise.all(posts.map(async ({date, title}) => createDirectory(date, title))).then(() => {
                console.log('directories created')
                Promise.all(posts.map(post => downloadImages(post.images, getPath(post.date, post.title)))).then(
                    () => console.log('done'))
            })
        })
    })    
})
