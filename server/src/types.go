package main

type node struct {
	ID  int    `json:"id,string"`
	URL string `json:"url"`
}

type edge struct {
	FromID int `json:"fromId,string"`
	ToID   int `json:"toId,string"`
}

type linkData struct {
	Nodes []node `json:"nodes"`
	Edges []edge `json:"edges"`
}
