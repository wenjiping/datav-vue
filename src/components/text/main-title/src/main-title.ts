import { DatavComponent } from '@/components/datav-component'
import {
  DataConfigMap, createField, setDataConfig,
  SourceConfigMap, setSourceData,
} from '@/components/data-source'

export class MainTitle extends DatavComponent {
  config = {
    title: '我是标题数据',
    textStyle: {
      fontFamily: 'Microsoft Yahei',
      fontSize: 24,
      color: '#fff',
      fontWeight: 'normal',
    },
    textAlign: 'center',
    writingMode: 'horizontal-tb',
    letterSpacing: 0,
    backgroundStyle: {
      show: false,
      bgColor: '#008bff',
      borderRadius: 15,
      borderColor: '#fff',
      borderStyle: 'solid',
      borderWidth: 1,
    },
    ellipsis: false,
    urlConfig: {
      url: '',
      isBlank: false,
    },
  }

  data: DataConfigMap
  source: SourceConfigMap

  events: Record<string, any> = {}

  constructor() {
    super('MainTitle', { w: 300, h: 56 })

    this.initData()
  }

  initData() {
    const fields = [
      createField('title', { description: '标题值', optional: true }),
      createField('url', { description: '超链接', optional: true }),
    ]

    this.data = setDataConfig({} as any, 'source', {
      fields: Object.assign({}, ...fields),
    })

    this.source = setSourceData(this.id, {} as any, 'source', {
      title: '我是标题数据',
      url: '',
    })

    return this
  }
}

export default MainTitle
