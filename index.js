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
    return axios.get(url).then(response => {
        const $ = cheerio.load(response.data)
        const expandableObjects = $(selector)
        return extractLinks($, expandableObjects, blogPages)
    }) 
}

async function getBlogPages (url) {

}

const url = 'http://www.minimalb.art/'
const collapisbleObjectSelector = '.post-count-link'
const linkSelector = 'a'

getLinksBySelector(url, collapisbleObjectSelector).then(historicalLinks => {
    // console.log(historicalLinks)
    const result = async () => Promise.all(historicalLinks.map(async link => {
        return getLinksBySelector(link, linkSelector, true)
    }))

    result().then(res => {
        const flattened = [].concat.apply([], res)
        const uniq = [...new Set(flattened)]
        console.log(uniq)
    })
})
