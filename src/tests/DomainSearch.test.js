import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import DomainSearch from '../DomainSearch';
import SearchResults from '../SearchResults';
import util from '../util';

const props = {
  plid: '123',
  text: {
    available: '',
    notAvailable: ''
  },
  baseUrl: 'secureserver.net'
};

let spy;

beforeEach(() => {
  sinon.createSandbox();

  spy = sinon.stub(util, 'fetchJsonp').callsFake(() => Promise.resolve({
    exactMatchDomain: {},
    suggestedDomains: [],
    disclaimer: 'disclaimer'
  }));
});

afterEach(() => {
  sinon.restore();
});

describe('DomainSearch', () => {
  it('should render DomainSearch component', () => {
    shallow(<DomainSearch {...props} />);
  });

  it('should set domain when domainToCheck prop is set', () => {
    const newProps = {
      ...props,
      domainToCheck: 'testdomain.com'
    }

    const wrapper = shallow(<DomainSearch {...newProps} />);

    expect(wrapper.find('.search-field').props().value).toEqual('testdomain.com');
  });

  it('should update state when input is changed', () => {
    const wrapper = shallow(<DomainSearch {...props} />);
    wrapper.find('.search-field').simulate('change', { target: { value: 'testdomain.com' } });

    expect(wrapper.state('domain')).toEqual('testdomain.com');
  });

  it('should render spinner when searching', () => {
    const wrapper = shallow(<DomainSearch {...props} />);

    wrapper.setState({ searching: true });

    expect(wrapper.find('.rstore-loading')).toHaveLength(1);
  });

  it('should render spinner when adding to cart', () => {
    const wrapper = shallow(<DomainSearch {...props} />);

    wrapper.setState({ searching: false, submitting: true, results: { exactMatchDomain: { available: true } } });

    expect(wrapper.find('.rstore-loading')).toHaveLength(1);
  });

  it('should render error when adding to cart errors', () => {
    const wrapper = shallow(<DomainSearch {...props} />);

    wrapper.setState({ searching: false, submitting: false, error: true, exactMatchDomain: { available: true }, suggestedDomains: [] });

    expect(wrapper.find('.rstore-error')).toHaveLength(1);
  });

  it('should render error when domain search errors', () => {
    const wrapper = shallow(<DomainSearch {...props} />);

    wrapper.setState({ searching: false, submitting: false, error: true });

    expect(wrapper.find('.rstore-error')).toHaveLength(1);
  });

  it('should not call handleDomainSearch when an empty form is submitted', () => {
    const wrapper = mount(<DomainSearch {...props} />);

    wrapper.find('.search-form').simulate('submit', { preventDefault() {} });

    expect(spy.called).toBeFalsy();
  });

  it('should error if domain search fails', done => {
    const wrapper = mount(<DomainSearch {...props} />);

    util.fetchJsonp.restore();
    sinon.stub(util, 'fetchJsonp').callsFake(() => Promise.reject('error message'));

    wrapper.setState({ 'domain': 'test.com' });
    wrapper.find('.search-form').simulate('submit', { preventDefault() {} });

    setTimeout(() => {
      expect(wrapper.find('rstore-error'));
      done();
    }, 50);
  });

  it('should error if domain search returns error message', done => {
    const wrapper = mount(<DomainSearch {...props} />);

    util.fetchJsonp.restore();
    sinon.stub(util, 'fetchJsonp').callsFake(() => Promise.resolve({ error: { message: 'error message' } }));

    wrapper.setState({ 'domain': 'test.com' });
    wrapper.find('.search-form').simulate('submit', { preventDefault() {} });

    setTimeout(() => {
      expect(wrapper.find('rstore-error'));
      done();
    }, 50);
  });

  it('should add suggested domains to state on form submission', done => {
    const wrapper = mount(<DomainSearch {...props} />);
    const domain = { domain: 'test.com', available: true, salePrice: '0', listPrice: '0' };

    util.fetchJsonp.restore();
    sinon.stub(util, 'fetchJsonp').callsFake(() => Promise.resolve({
      exactMatchDomain: domain,
      suggestedDomains: [domain],
      disclaimer: 'disclaimer'
    }));

    wrapper.setState({ 'domain': 'test.com' });
    wrapper.find('.search-form').simulate('submit', { preventDefault() {} });

    setTimeout(() => {
      expect(wrapper.state('results').exactMatchDomain).toEqual(domain);
      expect(wrapper.state('results').suggestedDomains).toEqual([domain]);
      done();
    }, 50);
  });

  it('should give domain results after searching', () => {
    const wrapper = shallow(<DomainSearch {...props} />);
    const searchProps = {
      results: {},
      cartClick: () => {},
      text: {},
      plid: '',
      baseUrl: ''
    };

    wrapper.setState({ searching: true, completed: true });

    expect(wrapper.find(<SearchResults {...searchProps} />));
  });

  // Test the method/action attribute is expected
  // assert the form exists with those attributes
  // check value of hidden item inputs
  describe('Given continue to cart button is clicked', () => {
    const domain = 'test.com';

    it('should add exact domain', () => {
      const wrapper = mount(<DomainSearch {...props} />);

      wrapper.setState({
        searching: false,
        submitting: false,
        results: {
          exactMatchDomain: {
            available: true,
            domain,
            listPrice: '0.00'
          },
          suggestedDomains: []
        }
      });

      wrapper.find('.continue-form').simulate('submit', { preventDefault() {} });

      expect(wrapper.find('input[name="items"]')).toHaveLength(1);
      expect(wrapper.find('input[name="items"]').props().value).toContain(domain);
    });

    it('should add selected domains', () => {
      const wrapper = mount(<DomainSearch {...props} />);

      wrapper.setState({
        selectedDomains: [{
          id: 'domain',
          available: true,
          domain
        }],
        error: '',
        searching: false,
        submitting: false,
        results: {
          exactMatchDomain: {},
          suggestedDomains: []
        }
      });

      wrapper.find('.continue-form').simulate('submit', { preventDefault() {} });

      expect(wrapper.find('input[name="items"]')).toHaveLength(1);
      expect(wrapper.find('input[name="items"]').props().value).toContain(domain);
    });

    it('should set state to submitting', done => {
      const wrapper = mount(<DomainSearch {...props} />);

      wrapper.setState({
        selectedDomains: [{
          id: 'domain',
          available: true,
          domain
        }],
        results: { exactMatchDomain: {}, suggestedDomains: [] } });

      wrapper.find('.rstore-domain-continue-button').simulate('click', { preventDefault() {} });

      setTimeout(() => {
        expect(wrapper.state('submitting')).toBeTruthy();

        done();
      }, 50);
    });
  });

  it('should add domain to state when domain is selected', done => {
    const wrapper = mount(<DomainSearch {...props} />);

    const exactMatchDomainResult = { available: true, domain: 'available.com', listPrice: '0.00', salePrice: '9.00' };
    const suggestedDomainResult = { available: true, domain: 'suggest.com', listPrice: '0.00', salePrice: '9.00' };

    wrapper.setState({ results: { exactMatchDomain: exactMatchDomainResult, suggestedDomains: [suggestedDomainResult] } });

    wrapper.find('.rstore-domain-buy-button').at(0).simulate('click', { preventDefault() {} });
    wrapper.find('.rstore-domain-buy-button').at(1).simulate('click', { preventDefault() {} });

    setTimeout(() => {
      expect(wrapper.state('selectedDomains').length).toEqual(2);

      done();
    }, 50);
  });

  it('should remove domain from state when domain is un-selected', done => {
    const wrapper = mount(<DomainSearch {...props} />);
    const exactMatchDomainResult = { available: true, domain: 'available.com', listPrice: '0.00', salePrice: '9.00' };
    const suggestedDomainResult = { available: true, domain: 'suggest.com', listPrice: '0.00', salePrice: '9.00' };

    wrapper.setState({
      results: {
        exactMatchDomain: exactMatchDomainResult,
        suggestedDomains: [suggestedDomainResult]
      },
      selectedDomains: [exactMatchDomainResult]
    });

    wrapper.find('.rstore-domain-buy-button').at(0).simulate('click', { preventDefault() {} });
    wrapper.find('.rstore-domain-buy-button').at(1).simulate('click', { preventDefault() {} });
    setTimeout(() => {
      expect(wrapper.state('selectedDomains').length).toEqual(1);

      done();
    }, 50);
  });

  it('should prompt user to prevent navigation when domains are selected', () => {
    const wrapper = mount(<DomainSearch {...props} />);
    const exactMatchDomainResult = { available: true, domain: 'available.com', listPrice: '0.00', salePrice: '9.00' };
    const suggestedDomainResult = { available: true, domain: 'suggest.com', listPrice: '0.00', salePrice: '9.00' };

    wrapper.setState({
      results: {
        exactMatchDomain: exactMatchDomainResult,
        suggestedDomains: [suggestedDomainResult]
      },
      selectedDomains: [exactMatchDomainResult]
    });

    expect(global.onbeforeunload()).toEqual('');
  });

  it('should not prompt user to prevent navigation when no domains are selected', () => {
    const wrapper = mount(<DomainSearch {...props} />);
    const exactMatchDomainResult = { available: false, domain: 'unavailable.com', listPrice: '0.00', salePrice: '9.00' };
    const suggestedDomainResult = { available: true, domain: 'suggest.com', listPrice: '0.00', salePrice: '9.00' };

    wrapper.setState({
      results: {
        exactMatchDomain: exactMatchDomainResult,
        suggestedDomains: [suggestedDomainResult]
      },
      selectedDomains: []
    });

    expect(global.onbeforeunload()).toEqual(undefined);
  });
});
