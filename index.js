// const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
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
        const post = {
            title: $('.post-title').text(),
            date: $('.published').attr('title'),
            images: []
        }
        $('.post-body').find('img').each((_, el) => {
            post.images.push($(el).attr('src'))
        })
        return post
    })
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
        Promise.all(uniq.map(async post => parseBlogPost(post))).then(posts => console.log(posts))
    })    
})
