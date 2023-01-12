import * as core from '@actions/core'
import {Config} from './types'
import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'
// eslint-disable-next-line import/no-unresolved
import {PullRequestEvent} from '@octokit/webhooks-definitions/schema'

function includesKeywords(title: string, keywords: string[]): boolean {
  for (const keyword of keywords) {
    if (title.toLowerCase().includes(keyword.toLowerCase()) === true) {
      return true
    }
  }

  return false
}

function getAllReviewers(config: Config): string[] {
  const reviewers: string[] = []

  for (const reviewGroup of Object.values(config.reviewGroups)) {
    reviewers.push(...reviewGroup.reviewers)
  }

  return reviewers
}

function selectReviewers(users: string[], numberOfUsers: number): string[] {
  const selectedUsers: string[] = []

  for (let i = 0; i < numberOfUsers; i++) {
    const index = Math.floor(Math.random() * users.length)
    selectedUsers.push(users[index])
    users.splice(index, 1)
  }

  return selectedUsers
}

async function getTeamMembers(
  client: InstanceType<typeof GitHub>,
  context: Context,
  teamSlug: string
): Promise<string[]> {
  const members = await client.rest.teams.listMembersInOrg({
    org: context.repo.owner,
    team_slug: teamSlug
  })

  const membersList = members.data.map(member => member.login)
  return membersList
}

async function getAllTeamMembers(client: InstanceType<typeof GitHub>,
  context: Context,
  config: Config
): Promise<string[]> {
  const teamMembers: string[] = []

  for (const reviewTeam of Object.values(config.reviewTeams)) {
    const members = await getTeamMembers(client, context, reviewTeam.teamSlug)
    teamMembers.push(...members)
  }

  return teamMembers
}

export async function assignReviewers(
  client: InstanceType<typeof GitHub>,
  context: Context,
  config: Config
): Promise<void> {
  if (!context.payload.pull_request) {
    throw new Error('Webhook payload does not exist')
  }

  const {pull_request: event} = context.payload as PullRequestEvent
  const {
    title,
    draft,
    user,
    number,
    head: {ref: pullRequestBranch}
  } = event
  const {includeAllKeywords, excludeAllKeywords, reviewGroups} = config

  if (draft === true) {
    core.info('Skips the process since pr is a draft')
    return
  }

  if (user.type === 'Bot') {
    core.info('Skips the process since pr is created by a bot')
    return
  }

  if (
    excludeAllKeywords &&
    (includesKeywords(title, excludeAllKeywords) ||
      includesKeywords(pullRequestBranch, excludeAllKeywords))
  ) {
    core.info(
      'Skips the process since pr title or branch name includes excludeAllKeywords'
    )
    return
  }

  if (
    includeAllKeywords &&
    (includesKeywords(title, includeAllKeywords) ||
      includesKeywords(pullRequestBranch, includeAllKeywords))
  ) {
    core.info(
      'Assigns all reviewers since pr title or branch name includes includeAllKeywords'
    )
    const reviewers = getAllReviewers(config).concat(await getAllTeamMembers(client, context, config));
    await client.rest.pulls.requestReviewers({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: number,
      reviewers: reviewers.filter(reviewer => reviewer !== user.login)
    })
    return
  }

  const reviewers: string[] = []
  for (const reviewGroup of Object.values(reviewGroups)) {
    const selectedReviewers = selectReviewers(
      reviewGroup.reviewers,
      reviewGroup.numberOfReviewers
    )
    reviewers.push(...selectedReviewers)
  }

  core.info(
    `${Object.keys(config.reviewTeams).length} teams found in config file`
  )

  if (config.reviewTeams && Object.keys(config.reviewTeams).length !== 0) {
    for (const reviewTeam of Object.values(config.reviewTeams)) {
      const members = await getTeamMembers(
        client,
        context,
        reviewTeam.teamSlug
      )
  
      const notAlreadySelectedMembers = members.filter(member => {
        return !reviewers.includes(member)
      })
  
      if (reviewTeam.addAllTeamMembers === true) {
        reviewers.push(...notAlreadySelectedMembers)
        continue;
      }
  
      const selectedMembers = selectReviewers(
        notAlreadySelectedMembers,
        reviewTeam.numberOfReviewers!
      )
      reviewers.push(...selectedMembers)
    }
  }

  await client.rest.pulls.requestReviewers({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: number,
    reviewers: reviewers.filter(reviewer => {
      return reviewer !== user.login
    })
  })
}
