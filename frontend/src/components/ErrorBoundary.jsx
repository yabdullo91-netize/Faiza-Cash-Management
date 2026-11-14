import React from 'react';
export class ErrorBoundary extends React.Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidUpdate(previous){if(previous.resetKey!==this.props.resetKey&&this.state.failed)this.setState({failed:false});}
  render(){if(!this.state.failed)return this.props.children;return <section className="panel page-state" role="alert"><h2>Не удалось показать раздел</h2><p>Остальные разделы доступны. Попробуйте загрузить данные повторно.</p><div className="row-actions"><button className="button primary" onClick={()=>{this.setState({failed:false});this.props.onRetry?.();}}>Повторить загрузку</button><button className="button secondary" onClick={this.props.onHome}>Перейти в обзор</button></div></section>;}
}
