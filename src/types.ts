
interface ReviewGroup {
    reviewers: string[];
    numberOfReviewers: number;
}

export interface Config {
    reviewGroups: { [key: string]: ReviewGroup }
    includeAllKeywords: string[]
    excludeAllKeywords: string[]
}