SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../include
LDIR := ../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

all:
	make -C misc    IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C mst    IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C sPath  IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C maxFlo IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C mcFlo  IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C match  IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all
	make -C eColor  IDIR='../${IDIR}' LDIR='../${LDIR}' BIN='${BIN}' \
		       CXXFLAGS='${CXXFLAGS}' all

clean:
	make -C misc   clean
	make -C mst    clean
	make -C sPath  clean
	make -C maxFlo clean
	make -C mcFlo  clean
	make -C match  clean
	make -C eColor  clean
