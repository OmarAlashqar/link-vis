package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gocolly/colly/v2"
	"github.com/joho/godotenv"
)

func homeHandler(c *gin.Context) {
	c.String(http.StatusOK, "Here be dragons!")
}

func normalizeURL(raw string) (string, error) {
	rawSeed, err := url.QueryUnescape(raw)
	if err != nil {
		return "", errors.New("tsk, what a shame")
	}

	parsedSeed, err := url.Parse(rawSeed)
	if err != nil {
		return "", errors.New("tsk, what a shame")
	}

	if !parsedSeed.IsAbs() {
		parsedSeed, err = url.Parse("http://" + rawSeed)
		if err != nil {
			return "", errors.New("tsk, what a shame")
		}
	}

	if parsedSeed.Host == "" {
		return "", errors.New("tsk, what a shame")
	}

	rebuiltSeed := parsedSeed.Scheme + "://" + parsedSeed.Host + parsedSeed.Path

	return rebuiltSeed, nil
}

func createGenID() func() int {
	var i int = 1
	return func() int {
		i++
		return i
	}
}

func crawlHandler(c *gin.Context) {
	seed, err := normalizeURL(c.Query("seed"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"errors": []gin.H{
				{"field": "url", "message": "Invalid URL"},
			},
		})
		return
	}

	nodes := []node{}
	edges := []edge{}
	visited := make(map[string]int)
	var mut sync.Mutex

	genID := createGenID()

	seedID := genID()
	// not a concurrent access
	nodes = append(nodes, node{seedID, seed})
	visited[seed] = seedID

	coll := colly.NewCollector(
		colly.MaxDepth(3),
		colly.Async(true),
	)

	coll.Limit(&colly.LimitRule{DomainGlob: "*", Parallelism: 10})

	coll.SetRedirectHandler(func(req *http.Request, via []*http.Request) error {
		var hrefRaw, hrefFromRaw string

		for i := range via {
			hrefRaw = via[i].URL.String()
			if i == len(via)-1 {
				hrefFromRaw = req.URL.String()
			} else {
				hrefFromRaw = via[i+1].URL.String()
			}

			href, err := normalizeURL(hrefRaw)
			if err != nil {
				return errors.New("tsk, what a shame")
			}

			hrefFrom, err := normalizeURL(hrefFromRaw)
			if err != nil {
				return errors.New("tsk, what a shame")
			}

			hrefID, ok := visited[href]
			if !ok {
				hrefID = genID()
			}

			hrefFromID, ok := visited[hrefFrom]
			if !ok {
				hrefFromID = genID()
			}

			// concurrent writes
			mut.Lock()

			visited[hrefFrom] = hrefFromID
			if i == len(via)-1 {
				visited[href] = hrefID
			}

			nodes = append(nodes, node{hrefID, href})
			nodes = append(nodes, node{hrefFromID, hrefFrom})
			edges = append(edges, edge{hrefFromID, hrefID})
			mut.Unlock()
		}

		return nil
	})

	coll.OnHTML("a[href]", func(e *colly.HTMLElement) {
		hrefFrom := e.Request.URL.String()
		hrefFromID := visited[hrefFrom]

		hrefRaw := e.Attr("href")
		href, err := normalizeURL(hrefRaw)
		if err != nil {
			return
		}

		hrefID, ok := visited[href]

		// concurrent writes
		mut.Lock()
		if ok {
			// already visited
			edges = append(edges, edge{hrefFromID, hrefID})
			mut.Unlock()
		} else {
			hrefID := genID()
			visited[href] = hrefID

			nodes = append(nodes, node{hrefFromID, hrefFrom})
			nodes = append(nodes, node{hrefID, href})
			edges = append(edges, edge{hrefFromID, hrefID})
			mut.Unlock()

			e.Request.Visit(href)
		}
	})

	err = coll.Visit(seed)
	coll.Wait()

	if err != nil {
		log.Println("Colly error: " + err.Error())
		return
	}

	result, err := json.Marshal(gin.H{"data": linkData{nodes, edges}})
	if err != nil {
		log.Println("failed to serialize response:", err)
		return
	}

	c.Data(http.StatusOK, "application/json", result)
}

func main() {
	// load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	corsOriginsStr := os.Getenv("CORS_ORIGIN")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// setup gin router
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins: strings.Split(corsOriginsStr, ";"),
	}))

	router.GET("/", homeHandler)
	router.GET("/crawl", crawlHandler)

	// start server
	log.Fatal(router.Run(":" + port))
}
