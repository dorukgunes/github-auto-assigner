interface ReviewTeam {
  teamSlug: string
  addAllTeamMembers?: boolean
  numberOfReviewers?: number
}

interface ReviewGroup {
  reviewers: string[]
  numberOfReviewers: number
}

export interface Config {
  reviewGroups: {[key: string]: ReviewGroup}
  reviewTeams : {[key: string]: ReviewTeam}
  includeAllKeywords: string[]
  excludeAllKeywords: string[]
}
