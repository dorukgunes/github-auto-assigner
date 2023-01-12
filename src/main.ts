import * as core from '@actions/core'
import * as github from '@actions/github'
import * as yaml from 'js-yaml'
import {Config} from './types'
import {GitHub} from '@actions/github/lib/utils'
import {assignReviewers} from './assign-reviewers'

async function getConfiguration(
  client: InstanceType<typeof GitHub>,
  options: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<Config> {
  const {owner, repo, path, ref} = options
  const result = await client.rest.repos.getContent({
    owner,
    repo,
    path,
    ref
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = result.data

  if (!data.content) {
    throw new Error('the configuration file is not found')
  }

  const configString = Buffer.from(data.content, 'base64').toString()
  const config = yaml.load(configString)

  return config as Config
}

async function run(): Promise<void> {
  try {
    const token = core.getInput('token', {required: true})
    const configPath = core.getInput('configuration-path', {
      required: true
    })

    const client = github.getOctokit(token)
    const {context} = github

    const config: Config = await getConfiguration(client, {
      owner: context.repo.owner,
      repo: context.repo.repo,
      path: configPath,
      ref: context.sha
    })

    await assignReviewers(client, context, config)

    core.info('Successfully assigned reviewers')
  } catch (error) {
    if (error instanceof Error) {
      core.debug(error.stack || '')
      core.error(error)
      core.setFailed(error.stack || error.message)
    }
  }
}

run()
