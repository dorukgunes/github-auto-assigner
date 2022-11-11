# Auto Assigner

An action which adds selected number reviewers per team to the pull request when the pull request is opened.

## Usage

Create a workflow (e.g. `.github/workflows/action.yml` For more detail, refer to [Configuring a workflow](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file)) for running the auto-assign action.

```yml
name: 'Auto Assign Action'
on:
  pull_request:
    types: [opened, ready_for_review]

jobs:
  add-reviewers:
    runs-on: ubuntu-latest
    steps:
      - uses: zeplin/auto-assign-reviewers@v0.3
        with:
          configuration-path: '.github/some_name_for_config.yml' # Only needed if you use something other than .github/auto_assign.yml
```


### Example
```yaml

# A list of reviewers, split into different groups, to be added to pull requests (GitHub user name)
reviewGroups:
  groupA:
    numberOfReviewers: 1
    reviewers:
      - reviewerA
      - reviewerB
      - reviewerC
  groupB:
    numberOfReviewers: 2
    reviewers:
      - reviewerD
      - reviewerE
      - reviewerF

# A list of keywords to add all reviewers to the pull request if pull requests title or branch name include it
# includeAllKeywords:
#   - hotfix
#   - release

# A list of keywords to avoid adding reviewers if pull requests title or branch name include it
# excludeAllKeywords:
#   - wip
#   - draft
```

## Development
After you develop you changes make sure to follow these actions
- Make sure run `npm run build`
- Commit your changes
- To release, make you sure to create a tag 

## Licence
MIT